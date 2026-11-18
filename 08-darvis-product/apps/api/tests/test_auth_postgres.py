import os
from collections.abc import Generator
from datetime import UTC, datetime, timedelta
from concurrent.futures import ThreadPoolExecutor
from threading import Barrier

import pytest
from fastapi import HTTPException
from sqlalchemy import create_engine, select
from sqlalchemy.engine import make_url
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import get_settings
from app.core.security import hash_refresh_token
from app.db.base import Base
from app.models import AuthRateLimit, AuthSession, RefreshToken, User
from app.services import auth as auth_service
from app.services.auth import (
    _consume_rate_limit,
    login,
    logout_all,
    logout_session,
    refresh_session,
    setup_owner,
)

TEST_DATABASE_URL = os.getenv("TEST_DATABASE_URL")
if TEST_DATABASE_URL:
    test_database_url = make_url(TEST_DATABASE_URL)
    if (
        test_database_url.get_backend_name() != "postgresql"
        or not (test_database_url.database or "").endswith("_test")
    ):
        raise RuntimeError(
            "Os testes de integração só podem usar PostgreSQL com nome terminado em _test; "
            "o fixture apaga registros do banco de teste."
        )
pytestmark = pytest.mark.skipif(
    not TEST_DATABASE_URL,
    reason="Defina TEST_DATABASE_URL para executar os testes de integração PostgreSQL",
)


@pytest.fixture
def db_session() -> Generator[Session, None, None]:
    if not TEST_DATABASE_URL:
        pytest.skip("PostgreSQL de teste não configurado")
    engine = create_engine(TEST_DATABASE_URL, pool_pre_ping=True)
    connection = engine.connect()
    transaction = connection.begin()
    for table in reversed(Base.metadata.sorted_tables):
        connection.execute(table.delete())
    session = Session(bind=connection, join_transaction_mode="create_savepoint")
    try:
        yield session
    finally:
        session.close()
        transaction.rollback()
        connection.close()
        engine.dispose()


def _create_owner(db: Session):
    setup_token = get_settings().initial_setup_token.get_secret_value()
    return setup_owner(
        db,
        email="proprietario@darvis.test",
        full_name="Proprietário D.A.R.V.I.S.",
        password="senha-de-integracao-segura",
        setup_token=setup_token,
        ip_address="192.0.2.10",
    )


def test_setup_is_one_time_and_login_creates_a_separate_session(db_session: Session) -> None:
    first = _create_owner(db_session)
    user = db_session.scalar(select(User).where(User.email == "proprietario@darvis.test"))
    assert user is not None
    assert db_session.scalar(
        select(RefreshToken).where(
            RefreshToken.token_hash == hash_refresh_token(first.refresh_token)
        )
    ) is not None

    with pytest.raises(HTTPException) as error:
        _create_owner(db_session)
    assert error.value.status_code == 409

    authenticated = login(
        db_session,
        email="PROPRIETARIO@DARVIS.TEST",
        password="senha-de-integracao-segura",
        ip_address="192.0.2.10",
    )
    assert authenticated.user.id == user.id
    assert authenticated.refresh_token != first.refresh_token
    assert len(
        db_session.scalars(select(AuthSession).where(AuthSession.user_id == user.id)).all()
    ) == 2


def test_refresh_rotation_and_reuse_revoke_the_session_family(db_session: Session) -> None:
    initial = _create_owner(db_session)
    session = db_session.scalar(
        select(AuthSession).where(
            AuthSession.refresh_token_hash == hash_refresh_token(initial.refresh_token)
        )
    )
    assert session is not None

    rotated = refresh_session(
        db_session, raw_token=initial.refresh_token, ip_address="192.0.2.11"
    )
    current_record = db_session.scalar(
        select(RefreshToken).where(
            RefreshToken.token_hash == hash_refresh_token(rotated.refresh_token)
        )
    )
    old_record = db_session.scalar(
        select(RefreshToken).where(
            RefreshToken.token_hash == hash_refresh_token(initial.refresh_token)
        )
    )
    assert current_record is not None
    assert old_record is not None and old_record.consumed_at is not None
    assert old_record.replaced_by_hash == current_record.token_hash
    assert old_record.token_hash != initial.refresh_token

    with pytest.raises(HTTPException) as error:
        refresh_session(
            db_session, raw_token=initial.refresh_token, ip_address="192.0.2.11"
        )
    assert error.value.status_code == 401

    db_session.refresh(session)
    assert session.revoked_at is not None
    assert session.revoke_reason == "refresh_token_reuse"


def test_rate_limit_is_persistent_and_blocks_after_threshold(db_session: Session) -> None:
    first = _consume_rate_limit(
        db_session,
        scope="integration-test",
        value="192.0.2.99",
        limit=2,
        window_seconds=900,
        block_seconds=1800,
    )
    second = _consume_rate_limit(
        db_session,
        scope="integration-test",
        value="192.0.2.99",
        limit=2,
        window_seconds=900,
        block_seconds=1800,
    )
    third = _consume_rate_limit(
        db_session,
        scope="integration-test",
        value="192.0.2.99",
        limit=2,
        window_seconds=900,
        block_seconds=1800,
    )
    assert first is False
    assert second is True
    assert third is True
    assert db_session.scalar(select(AuthRateLimit)) is not None


def test_logout_current_session_then_logout_all(db_session: Session) -> None:
    first = _create_owner(db_session)
    second = login(
        db_session,
        email="proprietario@darvis.test",
        password="senha-de-integracao-segura",
        ip_address="192.0.2.12",
    )

    first_session = db_session.scalar(
        select(AuthSession).where(
            AuthSession.refresh_token_hash == hash_refresh_token(first.refresh_token)
        )
    )
    second_session = db_session.scalar(
        select(AuthSession).where(
            AuthSession.refresh_token_hash == hash_refresh_token(second.refresh_token)
        )
    )
    assert first_session is not None
    assert second_session is not None

    logout_session(
        db_session, raw_token=first.refresh_token, ip_address="192.0.2.12"
    )
    db_session.refresh(first_session)
    db_session.refresh(second_session)
    assert first_session.revoked_at is not None
    assert first_session.revoke_reason == "logout"
    assert second_session.revoked_at is None

    logout_all(db_session, user=second.user, ip_address="192.0.2.12")
    db_session.refresh(second_session)
    assert second_session.revoked_at is not None
    assert second_session.revoke_reason == "logout_all"


def test_invalid_password_returns_generic_authentication_error(db_session: Session) -> None:
    _create_owner(db_session)

    with pytest.raises(HTTPException) as known_user_error:
        login(
            db_session,
            email="proprietario@darvis.test",
            password="senha-incorreta",
            ip_address="192.0.2.31",
        )
    with pytest.raises(HTTPException) as unknown_user_error:
        login(
            db_session,
            email="nao-existe@darvis.test",
            password="senha-incorreta",
            ip_address="192.0.2.32",
        )

    assert known_user_error.value.status_code == 401
    assert unknown_user_error.value.status_code == 401
    assert known_user_error.value.detail == unknown_user_error.value.detail



def test_concurrent_refresh_reuse_revokes_the_session_family() -> None:
    engine = create_engine(TEST_DATABASE_URL, pool_pre_ping=True)
    session_factory = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)
    try:
        with engine.begin() as connection:
            for table in reversed(Base.metadata.sorted_tables):
                connection.execute(table.delete())

        setup_token = get_settings().initial_setup_token.get_secret_value()
        with session_factory() as db:
            initial = setup_owner(
                db,
                email="concorrencia@darvis.test",
                full_name="Teste concorrente",
                password="senha-de-integracao-segura",
                setup_token=setup_token,
                ip_address="192.0.2.40",
            )

        barrier = Barrier(2)

        def rotate_token(ip_address: str) -> tuple[str, int | str]:
            with session_factory() as db:
                barrier.wait(timeout=10)
                try:
                    result = refresh_session(
                        db,
                        raw_token=initial.refresh_token,
                        ip_address=ip_address,
                    )
                    return ("success", result.refresh_token)
                except HTTPException as error:
                    return ("rejected", error.status_code)

        with ThreadPoolExecutor(max_workers=2) as pool:
            outcomes = list(
                pool.map(rotate_token, ["192.0.2.41", "192.0.2.42"])
            )

        assert sum(outcome[0] == "success" for outcome in outcomes) == 1
        assert sum(outcome == ("rejected", 401) for outcome in outcomes) == 1

        with session_factory() as db:
            owner = db.scalar(select(User).where(User.email == "concorrencia@darvis.test"))
            assert owner is not None
            session = db.scalar(
                select(AuthSession).where(AuthSession.user_id == owner.id)
            )
            assert session is not None
            assert session.revoked_at is not None
            assert session.revoke_reason == "refresh_token_reuse"
    finally:
        with engine.begin() as connection:
            for table in reversed(Base.metadata.sorted_tables):
                connection.execute(table.delete())
        engine.dispose()


def test_consecutive_failed_logins_lock_account_and_expiry_resets_counter(
    db_session: Session,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    _create_owner(db_session)
    start = datetime.now(UTC)

    for attempt in range(8):
        with pytest.raises(HTTPException) as error:
            login(
                db_session,
                email="proprietario@darvis.test",
                password="senha-incorreta",
                ip_address=f"192.0.2.{50 + attempt}",
            )
        assert error.value.status_code == 401

    user = db_session.scalar(select(User).where(User.email == "proprietario@darvis.test"))
    assert user is not None
    assert user.failed_login_attempts == 8
    assert user.locked_until is not None
    assert user.locked_until > start

    # Mesmo a senha correta não libera a conta durante a janela de bloqueio.
    with pytest.raises(HTTPException) as blocked_error:
        login(
            db_session,
            email="proprietario@darvis.test",
            password="senha-de-integracao-segura",
            ip_address="192.0.2.70",
        )
    assert blocked_error.value.status_code == 401

    monkeypatch.setattr(
        auth_service,
        "utc_now",
        lambda: start + timedelta(minutes=16),
    )
    authenticated = login(
        db_session,
        email="proprietario@darvis.test",
        password="senha-de-integracao-segura",
        ip_address="192.0.2.71",
    )
    db_session.refresh(user)
    assert authenticated.user.id == user.id
    assert user.failed_login_attempts == 0
    assert user.locked_until is None
