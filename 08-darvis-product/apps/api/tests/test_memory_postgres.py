import os
from collections.abc import Generator
from sqlalchemy import create_engine, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.engine import make_url
from sqlalchemy.orm import Session
import pytest
from fastapi import HTTPException

from app.api.schemas.memory import MemoryCreate, MemoryUpdate
from app.core.config import get_settings
from app.core.security import hash_password
from app.db.base import Base
from app.models import MemoryEntry, User, AuditEvent
from app.services.memory import create_memory, update_memory, delete_memory, list_memory, get_memory

TEST_DATABASE_URL = os.getenv("TEST_DATABASE_URL")
if TEST_DATABASE_URL:
    parsed = make_url(TEST_DATABASE_URL)
    if parsed.get_backend_name() != "postgresql" or not (parsed.database or "").endswith("_test"):
        raise RuntimeError("TEST_DATABASE_URL precisa apontar para um PostgreSQL de teste terminado em _test.")

pytestmark = pytest.mark.skipif(not TEST_DATABASE_URL, reason="PostgreSQL de teste não configurado")


@pytest.fixture
def db_session() -> Generator[Session, None, None]:
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


def create_owner(db: Session, email: str = "memoria@darvis.test") -> User:
    from app.services.auth import setup_owner

    return setup_owner(
        db,
        email=email,
        full_name="Proprietário",
        password="senha-de-integracao-segura",
        setup_token=get_settings().initial_setup_token.get_secret_value(),
        ip_address="192.0.2.130",
    ).user


def test_memory_crud_search_archive_and_audit(db_session: Session) -> None:
    owner = create_owner(db_session)
    entry = create_memory(
        db_session,
        user_id=owner.id,
        payload=MemoryCreate(
            title="Preferência de comunicação",
            content="Gosto de instruções claras e organizadas.",
            category="preference",
            tags=["Comunicação", "trabalho", " comunicação "],
            is_pinned=True,
        ),
    )
    assert entry.source == "manual"
    assert entry.tags == ["comunicação", "trabalho"]
    assert list_memory(
        db_session, user_id=owner.id, category="preference",
        query="instruções claras", include_archived=False, limit=20, offset=0
    )[0].id == entry.id

    updated = update_memory(
        db_session,
        user_id=owner.id,
        memory_id=entry.id,
        payload=MemoryUpdate(is_archived=True, content="Prefiro textos diretos."),
    )
    assert updated.is_archived is True
    assert list_memory(
        db_session, user_id=owner.id, category=None, query=None,
        include_archived=False, limit=20, offset=0
    ) == []

    events = db_session.scalars(
        select(AuditEvent).where(
            AuditEvent.actor_user_id == owner.id,
            AuditEvent.resource_type == "memory_entry",
        )
    ).all()
    assert {event.event_type for event in events} >= {"memory.created", "memory.updated"}

    delete_memory(db_session, user_id=owner.id, memory_id=entry.id)
    with pytest.raises(HTTPException) as error:
        get_memory(db_session, user_id=owner.id, memory_id=entry.id)
    assert error.value.status_code == 404


def test_memory_is_isolated_between_owners(db_session: Session) -> None:
    owner = create_owner(db_session)
    foreign = User(
        email="outra-memoria@darvis.test",
        full_name="Outro",
        password_hash=hash_password("outra-senha-segura"),
    )
    db_session.add(foreign)
    db_session.flush()
    entry = create_memory(
        db_session,
        user_id=foreign.id,
        payload=MemoryCreate(title="Privada", content="Conteúdo privado"),
    )

    with pytest.raises(HTTPException) as error:
        get_memory(db_session, user_id=owner.id, memory_id=entry.id)
    assert error.value.status_code == 404
    assert list_memory(
        db_session, user_id=owner.id, category=None, query=None,
        include_archived=True, limit=50, offset=0
    ) == []


def test_database_rejects_non_manual_source_and_unknown_category(
    db_session: Session,
) -> None:
    owner = create_owner(db_session)

    with pytest.raises(IntegrityError):
        db_session.add(
            MemoryEntry(
                user_id=owner.id,
                title="Origem inválida",
                content="Memória não manual.",
                category="fact",
                tags=[],
                source="assistant",
            )
        )
        db_session.flush()
    db_session.rollback()

    with pytest.raises(IntegrityError):
        db_session.add(
            MemoryEntry(
                user_id=owner.id,
                title="Categoria inválida",
                content="Categoria fora da allowlist.",
                category="unknown",
                tags=[],
                source="manual",
            )
        )
        db_session.flush()
    db_session.rollback()
