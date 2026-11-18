from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.security import create_token, hash_password, verify_password
from app.models.user import User
from app.schemas.auth import TokenPair
from app.services.audit import record

# Hash falso: evita revelar (por tempo de resposta) se o e-mail existe.
_DUMMY_HASH = hash_password("senha-falsa-para-equalizar-tempo")


def _locked(user: User) -> bool:
    lu = user.locked_until
    if lu is None:
        return False
    if lu.tzinfo is None:  # SQLite devolve datetime sem fuso
        lu = lu.replace(tzinfo=timezone.utc)
    return lu > datetime.now(timezone.utc)


def issue_tokens(user: User) -> TokenPair:
    access, expires = create_token(user.id, "access", user.token_version)
    refresh, _ = create_token(user.id, "refresh", user.token_version)
    return TokenPair(access_token=access, refresh_token=refresh, expires_in=expires)


def authenticate(db: Session, email: str, password: str, ip: str | None) -> User:
    s = get_settings()
    invalid = HTTPException(status.HTTP_401_UNAUTHORIZED, "Credenciais inválidas", headers={"WWW-Authenticate": "Bearer"})
    user = db.scalar(select(User).where(User.email == email.strip().lower()))

    if user is None:
        verify_password(password, _DUMMY_HASH)
        record(db, "login_failed", ip=ip, detail="usuario_desconhecido")
        db.commit()
        raise invalid

    if _locked(user):
        record(db, "login_blocked", user_id=user.id, ip=ip)
        db.commit()
        raise HTTPException(status.HTTP_429_TOO_MANY_REQUESTS, "Conta temporariamente bloqueada. Tente mais tarde.")

    if not user.is_active or not verify_password(password, user.password_hash):
        user.failed_attempts += 1
        if user.failed_attempts >= s.max_failed_logins:
            user.locked_until = datetime.now(timezone.utc) + timedelta(minutes=s.lockout_minutes)
            user.failed_attempts = 0
            record(db, "account_locked", user_id=user.id, ip=ip)
        record(db, "login_failed", user_id=user.id, ip=ip)
        db.commit()
        raise invalid

    user.failed_attempts = 0
    user.locked_until = None
    record(db, "login_ok", user_id=user.id, ip=ip)
    db.commit()
    return user


def create_user(db: Session, email: str, password: str, full_name: str = "") -> User:
    user = User(email=email.strip().lower(), password_hash=hash_password(password), full_name=full_name)
    db.add(user)
    record(db, "user_created", detail=user.email)
    db.commit()
    return user
