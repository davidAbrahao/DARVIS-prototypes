import os
from collections.abc import Generator

import pytest
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.security import hash_refresh_token
from app.db.base import Base
from app.models import AuthRateLimit, AuthSession, RefreshToken, User
from app.services.auth import _consume_rate_limit, login, refresh_session, setup_owner
from fastapi import HTTPException

TEST_DATABASE_URL = os.getenv("TEST_DATABASE_URL")
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
    assert db_session.scalar(select(RefreshToken).where(
        RefreshToken.token_hash == hash_refresh_token(first.refresh_token)
    )) is not None

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
    assert len(db_session.scalars(
        select(AuthSession).where(AuthSession.user_id == user.id)
    ).all()) == 2


def test_refresh_rotation_and_reuse_revoke_the_session_family(db_session: Session) -> None:
    initial = _create_owner(db_session)
    session = db_session.scalar(
        select(AuthSession).where(AuthSession.refresh_token_hash == hash_refresh_token(initial.refresh_token))
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
        db_session, scope="integration-test", value="192.0.2.99",
        limit=2, window_seconds=900, block_seconds=1800,
    )
    second = _consume_rate_limit(
        db_session, scope="integration-test", value="192.0.2.99",
        limit=2, window_seconds=900, block_seconds=1800,
    )
    third = _consume_rate_limit(
        db_session, scope="integration-test", value="192.0.2.99",
        limit=2, window_seconds=900, block_seconds=1800,
    )
    assert first is False
    assert second is True
    assert third is True
    assert db_session.scalar(select(AuthRateLimit)) is not None
