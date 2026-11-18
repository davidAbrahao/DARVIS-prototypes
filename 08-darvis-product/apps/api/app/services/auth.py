import hashlib
import hmac
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from typing import Any
from uuid import uuid4

from fastapi import HTTPException, status
from sqlalchemy import case, func, select, text
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.security import (
    create_access_token,
    hash_password,
    hash_refresh_token,
    new_csrf_token,
    new_refresh_token,
    password_needs_rehash,
    signing_key,
    verify_password,
)
from app.models.audit_event import AuditEvent
from app.models.auth_rate_limit import AuthRateLimit
from app.models.auth_session import AuthSession
from app.models.refresh_token import RefreshToken
from app.models.user import User


@dataclass(frozen=True)
class AuthResult:
    access_token: str
    refresh_token: str
    csrf_token: str
    expires_in: int
    user: User


def utc_now() -> datetime:
    return datetime.now(UTC)


def normalize_email(email: str) -> str:
    return email.strip().casefold()


def _audit(
    db: Session,
    *,
    event_type: str,
    outcome: str,
    actor_user_id: int | None = None,
    resource_id: str | None = None,
    ip_address: str | None = None,
    metadata: dict[str, Any] | None = None,
) -> None:
    db.add(
        AuditEvent(
            actor_user_id=actor_user_id,
            event_type=event_type,
            resource_type="auth_session" if resource_id else None,
            resource_id=resource_id,
            outcome=outcome,
            ip_address=ip_address,
            event_metadata=metadata or {},
        )
    )


def _bucket_hash(scope: str, value: str) -> str:
    try:
        key = signing_key().encode("utf-8")
    except RuntimeError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Autenticação indisponível: configure SECRET_KEY",
        ) from None
    return hmac.new(key, f"{scope}:{value}".encode("utf-8"), hashlib.sha256).hexdigest()


def _consume_rate_limit(
    db: Session,
    *,
    scope: str,
    value: str,
    limit: int,
    window_seconds: int,
    block_seconds: int,
) -> bool:
    """Incrementa um bucket por UPSERT atômico; coordena múltiplas réplicas PostgreSQL."""
    now = utc_now()
    bucket = _bucket_hash(scope, value)
    expired_window = AuthRateLimit.window_started_at <= now - timedelta(seconds=window_seconds)
    active_block = (
        AuthRateLimit.blocked_until.is_not(None) & (AuthRateLimit.blocked_until > now)
    )
    attempts = case(
        (active_block, AuthRateLimit.attempts),
        (expired_window, 1),
        else_=AuthRateLimit.attempts + 1,
    )
    window_started_at = case(
        (active_block, AuthRateLimit.window_started_at),
        (expired_window, now),
        else_=AuthRateLimit.window_started_at,
    )
    blocked_until = case(
        (active_block, AuthRateLimit.blocked_until),
        (expired_window, None),
        (AuthRateLimit.attempts >= limit - 1, now + timedelta(seconds=block_seconds)),
        else_=AuthRateLimit.blocked_until,
    )
    statement = (
        pg_insert(AuthRateLimit)
        .values(
            bucket_hash=bucket,
            window_started_at=now,
            attempts=1,
            blocked_until=None,
            updated_at=now,
        )
        .on_conflict_do_update(
            index_elements=[AuthRateLimit.bucket_hash],
            set_={
                "attempts": attempts,
                "window_started_at": window_started_at,
                "blocked_until": blocked_until,
                "updated_at": now,
            },
        )
        .returning(AuthRateLimit.blocked_until)
    )
    blocked = db.execute(statement).scalar_one()
    return blocked is not None and blocked > now


def _record_rate_limited(db: Session, event_type: str, ip_address: str | None) -> None:
    _audit(
        db,
        event_type=event_type,
        outcome="rate_limited",
        ip_address=ip_address,
        metadata={"reason": "limite_de_tentativas"},
    )
    db.commit()


def _create_session(db: Session, user: User) -> AuthResult:
    settings = get_settings()
    session_id = str(uuid4())
    family_id = str(uuid4())
    refresh_token = new_refresh_token()
    refresh_hash = hash_refresh_token(refresh_token)
    expires_at = utc_now() + timedelta(days=settings.refresh_token_ttl_days)
    session = AuthSession(
        id=session_id,
        user_id=user.id,
        family_id=family_id,
        refresh_token_hash=refresh_hash,
        expires_at=expires_at,
    )
    db.add(session)
    db.flush()
    db.add(
        RefreshToken(
            session_id=session_id,
            token_hash=refresh_hash,
            expires_at=expires_at,
        )
    )
    access_ttl = settings.access_token_ttl_minutes
    access_token = create_access_token(
        user_id=user.id, session_id=session_id, ttl_minutes=access_ttl
    )
    return AuthResult(
        access_token=access_token,
        refresh_token=refresh_token,
        csrf_token=new_csrf_token(),
        expires_in=access_ttl * 60,
        user=user,
    )


def setup_owner(
    db: Session, *, email: str, full_name: str, password: str, setup_token: str | None,
    ip_address: str | None,
) -> AuthResult:
    settings = get_settings()
    expected = settings.initial_setup_token.get_secret_value()
    if len(expected.encode("utf-8")) < 32:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Configuração inicial indisponível",
        )

    if _consume_rate_limit(
        db, scope="setup-ip", value=ip_address or "unknown",
        limit=5, window_seconds=900, block_seconds=3600,
    ):
        _record_rate_limited(db, "auth.setup.rate_limited", ip_address)
        raise HTTPException(status_code=429, detail="Muitas tentativas. Tente novamente mais tarde")

    if not setup_token or not hmac.compare_digest(expected, setup_token):
        _audit(
            db, event_type="auth.setup.rejected", outcome="rejected",
            ip_address=ip_address, metadata={"reason": "credencial_invalida"},
        )
        db.commit()
        raise HTTPException(status_code=403, detail="Não foi possível concluir a configuração")

    # O lock transacional impede duas primeiras configurações concorrentes, mesmo com e-mails distintos.
    db.execute(text("SELECT pg_advisory_xact_lock(724190261)"))
    if db.scalar(select(func.count(User.id))) > 0:
        _audit(
            db, event_type="auth.setup.rejected", outcome="rejected",
            ip_address=ip_address, metadata={"reason": "instalacao_ja_configurada"},
        )
        db.commit()
        raise HTTPException(status_code=409, detail="A configuração inicial já foi concluída")

    user = User(
        email=normalize_email(email),
        full_name=full_name.strip(),
        password_hash=hash_password(password),
    )
    db.add(user)
    db.flush()
    result = _create_session(db, user)
    _audit(
        db, event_type="auth.setup.completed", outcome="success",
        actor_user_id=user.id, ip_address=ip_address,
    )
    db.commit()
    return result


def login(
    db: Session, *, email: str, password: str, ip_address: str | None,
) -> AuthResult:
    normalized_email = normalize_email(email)
    ip_limited = _consume_rate_limit(
        db, scope="login-ip", value=ip_address or "unknown",
        limit=20, window_seconds=900, block_seconds=900,
    )
    identity_limited = _consume_rate_limit(
        db, scope="login-identity", value=normalized_email,
        limit=10, window_seconds=900, block_seconds=900,
    )
    if ip_limited or identity_limited:
        _record_rate_limited(db, "auth.login.rate_limited", ip_address)
        raise HTTPException(status_code=429, detail="Muitas tentativas. Tente novamente mais tarde")

    # Bloqueio pessimista serializa contadores de falha por identidade.
    user = db.scalar(select(User).where(User.email == normalized_email).with_for_update())
    now = utc_now()

    if user is not None and user.locked_until is not None:
        if user.locked_until > now:
            # Mantém custo de verificação semelhante, mas nunca autentica uma conta bloqueada.
            verify_password(password, user.password_hash)
            _audit(
                db, event_type="auth.login.failed", outcome="rejected",
                actor_user_id=user.id, ip_address=ip_address,
                metadata={"reason": "conta_temporariamente_bloqueada"},
            )
            db.commit()
            raise HTTPException(status_code=401, detail="E-mail ou senha inválidos")

        user.failed_login_attempts = 0
        user.locked_until = None

    password_valid = verify_password(password, user.password_hash if user else None)
    if user is None or not user.is_active or not password_valid:
        if user is not None and user.is_active:
            user.failed_login_attempts += 1
            if user.failed_login_attempts >= 8:
                user.locked_until = now + timedelta(minutes=15)

        _audit(
            db, event_type="auth.login.failed", outcome="rejected",
            actor_user_id=user.id if user else None,
            ip_address=ip_address, metadata={"reason": "credenciais_invalidas"},
        )
        db.commit()
        raise HTTPException(status_code=401, detail="E-mail ou senha inválidos")

    user.failed_login_attempts = 0
    user.locked_until = None
    if password_needs_rehash(user.password_hash):
        user.password_hash = hash_password(password)

    identity_bucket = _bucket_hash("login-identity", normalized_email)
    rate_row = db.get(AuthRateLimit, identity_bucket)
    if rate_row is not None:
        rate_row.attempts = 0
        rate_row.blocked_until = None
        rate_row.window_started_at = utc_now()

    result = _create_session(db, user)
    _audit(
        db, event_type="auth.login.succeeded", outcome="success",
        actor_user_id=user.id, ip_address=ip_address,
    )
    db.commit()
    return result


def refresh_session(
    db: Session, *, raw_token: str, ip_address: str | None,
) -> AuthResult:
    if _consume_rate_limit(
        db, scope="refresh-ip", value=ip_address or "unknown",
        limit=60, window_seconds=900, block_seconds=900,
    ):
        _record_rate_limited(db, "auth.refresh.rate_limited", ip_address)
        raise HTTPException(status_code=429, detail="Muitas tentativas. Tente novamente mais tarde")

    old_hash = hash_refresh_token(raw_token)
    token_record = db.scalar(
        select(RefreshToken).where(RefreshToken.token_hash == old_hash).with_for_update()
    )
    if token_record is None:
        _audit(
            db, event_type="auth.refresh.failed", outcome="rejected",
            ip_address=ip_address, metadata={"reason": "token_invalido"},
        )
        db.commit()
        raise HTTPException(status_code=401, detail="Sessão inválida ou expirada")

    session = db.scalar(
        select(AuthSession).where(AuthSession.id == token_record.session_id).with_for_update()
    )
    if session is None:
        db.commit()
        raise HTTPException(status_code=401, detail="Sessão inválida ou expirada")

    if token_record.consumed_at is not None:
        family_sessions = db.scalars(
            select(AuthSession).where(
                AuthSession.user_id == session.user_id,
                AuthSession.family_id == session.family_id,
            ).with_for_update()
        ).all()
        now = utc_now()
        for family_session in family_sessions:
            family_session.revoked_at = family_session.revoked_at or now
            family_session.revoke_reason = "refresh_token_reuse"
        _audit(
            db, event_type="auth.refresh.reuse_detected", outcome="security_event",
            actor_user_id=session.user_id, resource_id=session.id, ip_address=ip_address,
            metadata={"action": "familia_revogada"},
        )
        db.commit()
        raise HTTPException(status_code=401, detail="Sessão inválida ou expirada")

    now = utc_now()
    user = db.get(User, session.user_id)
    if (
        token_record.expires_at <= now
        or session.expires_at <= now
        or session.revoked_at is not None
        or user is None
        or not user.is_active
    ):
        if session.revoked_at is None:
            session.revoked_at = now
            session.revoke_reason = "expired_or_inactive"
        _audit(
            db, event_type="auth.refresh.failed", outcome="rejected",
            actor_user_id=session.user_id, resource_id=session.id, ip_address=ip_address,
            metadata={"reason": "sessao_expirada_ou_revogada"},
        )
        db.commit()
        raise HTTPException(status_code=401, detail="Sessão inválida ou expirada")

    new_raw_token = new_refresh_token()
    new_hash = hash_refresh_token(new_raw_token)
    new_expiry = now + timedelta(days=get_settings().refresh_token_ttl_days)
    token_record.consumed_at = now
    token_record.replaced_by_hash = new_hash
    session.refresh_token_hash = new_hash
    session.last_used_at = now
    session.expires_at = new_expiry
    db.add(
        RefreshToken(
            session_id=session.id,
            token_hash=new_hash,
            issued_at=now,
            expires_at=new_expiry,
        )
    )
    result = AuthResult(
        access_token=create_access_token(
            user_id=user.id,
            session_id=session.id,
            ttl_minutes=get_settings().access_token_ttl_minutes,
        ),
        refresh_token=new_raw_token,
        csrf_token=new_csrf_token(),
        expires_in=get_settings().access_token_ttl_minutes * 60,
        user=user,
    )
    _audit(
        db, event_type="auth.refresh.succeeded", outcome="success",
        actor_user_id=user.id, resource_id=session.id, ip_address=ip_address,
    )
    db.commit()
    return result


def logout_session(
    db: Session, *, raw_token: str | None, ip_address: str | None,
) -> None:
    session: AuthSession | None = None
    if raw_token:
        token_record = db.scalar(
            select(RefreshToken)
            .where(RefreshToken.token_hash == hash_refresh_token(raw_token))
            .with_for_update()
        )
        if token_record is not None:
            session = db.scalar(
                select(AuthSession).where(AuthSession.id == token_record.session_id).with_for_update()
            )
    if session is not None and session.revoked_at is None:
        session.revoked_at = utc_now()
        session.revoke_reason = "logout"
    _audit(
        db, event_type="auth.logout", outcome="success",
        actor_user_id=session.user_id if session else None,
        resource_id=session.id if session else None,
        ip_address=ip_address,
    )
    db.commit()


def logout_all(db: Session, *, user: User, ip_address: str | None) -> None:
    now = utc_now()
    sessions = db.scalars(
        select(AuthSession).where(
            AuthSession.user_id == user.id, AuthSession.revoked_at.is_(None)
        ).with_for_update()
    ).all()
    for session in sessions:
        session.revoked_at = now
        session.revoke_reason = "logout_all"
    _audit(
        db, event_type="auth.logout_all", outcome="success",
        actor_user_id=user.id, metadata={"sessions_revogadas": len(sessions)},
        ip_address=ip_address,
    )
    db.commit()
