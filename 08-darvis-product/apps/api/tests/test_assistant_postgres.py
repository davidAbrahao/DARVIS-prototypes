import os
from uuid import uuid4
from collections.abc import Generator

import pytest
from fastapi import HTTPException
from sqlalchemy import create_engine, select
from sqlalchemy.engine import make_url
from sqlalchemy.orm import Session

from app.api.schemas.assistant import ConversationCreate, ConversationUpdate, MessageCreate
from app.core.config import get_settings
from app.core.security import hash_password
from app.db.base import Base
from app.models import (
    AssistantConversation,
    AssistantMessage,
    AuditEvent,
    User,
)
from app.services import assistant as assistant_service
from app.services.assistant import (
    create_conversation,
    delete_conversation,
    list_conversations,
    list_messages,
    send_message,
    update_conversation,
)
from app.services.providers import (
    ChatTurn,
    GeneratedReply,
    ProviderGenerationError,
)

TEST_DATABASE_URL = os.getenv("TEST_DATABASE_URL")
if TEST_DATABASE_URL:
    test_database_url = make_url(TEST_DATABASE_URL)
    if (
        test_database_url.get_backend_name() != "postgresql"
        or not (test_database_url.database or "").endswith("_test")
    ):
        raise RuntimeError(
            "Os testes do assistente só podem usar PostgreSQL com nome terminado em _test; "
            "o fixture apaga registros do banco de teste."
        )
pytestmark = pytest.mark.skipif(
    not TEST_DATABASE_URL,
    reason="Defina TEST_DATABASE_URL para executar os testes do assistente PostgreSQL",
)


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


def _create_owner(db: Session, email: str = "assistente@darvis.test") -> User:
    from app.services.auth import setup_owner

    result = setup_owner(
        db,
        email=email,
        full_name="Proprietário D.A.R.V.I.S.",
        password="senha-de-integracao-segura",
        setup_token=get_settings().initial_setup_token.get_secret_value(),
        ip_address="192.0.2.110",
    )
    return result.user


class FakeProvider:
    provider_name = "fake"
    model_name = "fake-model"

    def __init__(self, response: str = "Resposta realista de teste") -> None:
        self.response = response
        self.calls: list[list[ChatTurn]] = []

    def generate(self, turns: list[ChatTurn]) -> GeneratedReply:
        self.calls.append(list(turns))
        return GeneratedReply(
            content=self.response,
            provider=self.provider_name,
            model=self.model_name,
        )


def test_conversation_messages_persist_and_history_is_reused(
    db_session: Session,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    owner = _create_owner(db_session)
    provider = FakeProvider()
    monkeypatch.setattr(assistant_service, "get_chat_provider", lambda: provider)

    conversation = create_conversation(
        db_session,
        user_id=owner.id,
        payload=ConversationCreate(),
    )
    first_turn = send_message(
        db_session,
        user_id=owner.id,
        conversation_id=conversation.id,
        payload=MessageCreate(request_id=uuid4(), content="Quero organizar meus projetos."),
    )
    second_turn = send_message(
        db_session,
        user_id=owner.id,
        conversation_id=conversation.id,
        payload=MessageCreate(request_id=uuid4(), content="Comece pelas prioridades."),
    )

    assert [message.role for message in first_turn] == ["user", "assistant"]
    assert first_turn[1].content == provider.response
    assert first_turn[1].provider == "fake"
    assert [message.role for message in second_turn] == ["user", "assistant"]
    assert len(provider.calls) == 2
    assert [turn.role for turn in provider.calls[1]] == [
        "user",
        "assistant",
        "user",
    ]
    assert provider.calls[1][-1].content == "Comece pelas prioridades."

    db_session.refresh(conversation)
    assert conversation.version == 2
    assert conversation.title == "Quero organizar meus projetos."
    assert len(
        list_messages(
            db_session,
            user_id=owner.id,
            conversation_id=conversation.id,
            limit=20,
            offset=0,
        )
    ) == 4

    events = db_session.scalars(
        select(AuditEvent).where(
            AuditEvent.actor_user_id == owner.id,
            AuditEvent.resource_type == "assistant_conversation",
        )
    ).all()
    assert {event.event_type for event in events} >= {
        "assistant.conversation.created",
        "assistant.exchange.completed",
    }


def test_conversation_and_message_access_is_scoped_to_owner(
    db_session: Session,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    owner = _create_owner(db_session)
    another_user = User(
        email="outro-assistente@darvis.test",
        full_name="Outro proprietário",
        password_hash=hash_password("outra-senha-segura"),
    )
    db_session.add(another_user)
    db_session.flush()

    conversation = create_conversation(
        db_session,
        user_id=another_user.id,
        payload=ConversationCreate(title="Conversa privada"),
    )
    provider = FakeProvider()
    monkeypatch.setattr(assistant_service, "get_chat_provider", lambda: provider)

    with pytest.raises(HTTPException) as list_error:
        list_messages(
            db_session,
            user_id=owner.id,
            conversation_id=conversation.id,
            limit=50,
            offset=0,
        )
    with pytest.raises(HTTPException) as send_error:
        send_message(
            db_session,
            user_id=owner.id,
            conversation_id=conversation.id,
            payload=MessageCreate(request_id=uuid4(), content="Acesso cruzado"),
        )

    assert list_error.value.status_code == 404
    assert send_error.value.status_code == 404
    assert provider.calls == []


def test_provider_failure_is_audited_without_persisting_a_partial_turn(
    db_session: Session,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    owner = _create_owner(db_session)
    conversation = create_conversation(
        db_session,
        user_id=owner.id,
        payload=ConversationCreate(),
    )

    class FailingProvider:
        provider_name = "fake"
        model_name = "fake-model"

        def generate(self, turns: list[ChatTurn]) -> GeneratedReply:
            raise ProviderGenerationError("Detalhe interno não deve ser exposto")

    monkeypatch.setattr(
        assistant_service, "get_chat_provider", lambda: FailingProvider()
    )

    with pytest.raises(HTTPException) as error:
        send_message(
            db_session,
            user_id=owner.id,
            conversation_id=conversation.id,
            payload=MessageCreate(request_id=uuid4(), content="Teste de indisponibilidade"),
        )

    assert error.value.status_code == 502
    assert "Detalhe interno" not in error.value.detail
    assert list_messages(
        db_session,
        user_id=owner.id,
        conversation_id=conversation.id,
        limit=50,
        offset=0,
    ) == []
    assert db_session.scalar(
        select(AuditEvent).where(
            AuditEvent.event_type == "assistant.generation.failed"
        )
    ) is not None


def test_concurrent_conversation_update_rejects_stale_generation(
    db_session: Session,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    owner = _create_owner(db_session)
    conversation = create_conversation(
        db_session,
        user_id=owner.id,
        payload=ConversationCreate(),
    )

    class ConcurrentProvider:
        provider_name = "fake"
        model_name = "fake-model"

        def generate(self, turns: list[ChatTurn]) -> GeneratedReply:
            update_conversation(
                db_session,
                user_id=owner.id,
                conversation_id=conversation.id,
                payload=ConversationUpdate(title="Renomeada durante a geração"),
            )
            return GeneratedReply(
                content="Resposta que não deve ser persistida",
                provider=self.provider_name,
                model=self.model_name,
            )

    monkeypatch.setattr(
        assistant_service, "get_chat_provider", lambda: ConcurrentProvider()
    )

    with pytest.raises(HTTPException) as error:
        send_message(
            db_session,
            user_id=owner.id,
            conversation_id=conversation.id,
            payload=MessageCreate(request_id=uuid4(), content="Mensagem concorrente"),
        )

    assert error.value.status_code == 409
    assert list_messages(
        db_session,
        user_id=owner.id,
        conversation_id=conversation.id,
        limit=50,
        offset=0,
    ) == []
    db_session.refresh(conversation)
    assert conversation.title == "Renomeada durante a geração"
    assert conversation.version == 1


def test_deleting_conversation_removes_its_messages(db_session: Session) -> None:
    owner = _create_owner(db_session)
    conversation = create_conversation(
        db_session,
        user_id=owner.id,
        payload=ConversationCreate(title="Conversa para excluir"),
    )
    db_session.add(
        AssistantMessage(
            conversation_id=conversation.id,
            user_id=owner.id,
            role="user",
            content="Mensagem de exemplo",
        )
    )
    db_session.commit()

    delete_conversation(
        db_session,
        user_id=owner.id,
        conversation_id=conversation.id,
    )

    assert db_session.get(AssistantConversation, conversation.id) is None
    assert db_session.scalar(
        select(AssistantMessage).where(
            AssistantMessage.conversation_id == conversation.id
        )
    ) is None


def test_repeated_request_id_returns_persisted_turn_without_calling_provider_again(
    db_session: Session,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    owner = _create_owner(db_session)
    provider = FakeProvider("Resposta idempotente")
    monkeypatch.setattr(assistant_service, "get_chat_provider", lambda: provider)
    conversation = create_conversation(
        db_session,
        user_id=owner.id,
        payload=ConversationCreate(),
    )
    request_id = uuid4()
    payload = MessageCreate(
        request_id=request_id,
        content="Envio que pode ser repetido após uma falha de rede",
    )

    first_result = send_message(
        db_session,
        user_id=owner.id,
        conversation_id=conversation.id,
        payload=payload,
    )
    second_result = send_message(
        db_session,
        user_id=owner.id,
        conversation_id=conversation.id,
        payload=payload,
    )

    assert [item.id for item in second_result] == [item.id for item in first_result]
    assert len(provider.calls) == 1
    assert len(
        list_messages(
            db_session,
            user_id=owner.id,
            conversation_id=conversation.id,
            limit=20,
            offset=0,
        )
    ) == 2
