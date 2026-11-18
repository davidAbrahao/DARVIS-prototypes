import pytest
from uuid import uuid4
from pydantic import ValidationError

from app.api.schemas.assistant import (
    ConversationCreate,
    ConversationUpdate,
    MessageCreate,
)


def test_conversation_schema_rejects_blank_title_and_unknown_fields() -> None:
    with pytest.raises(ValidationError):
        ConversationCreate(title="   ")
    with pytest.raises(ValidationError):
        ConversationCreate(title="Projeto pessoal", user_id=99)


def test_conversation_update_requires_a_valid_title() -> None:
    assert ConversationUpdate(title="Nova direção").title == "Nova direção"
    with pytest.raises(ValidationError):
        ConversationUpdate(title="   ")


def test_message_schema_rejects_blank_or_oversized_content() -> None:
    with pytest.raises(ValidationError):
        MessageCreate(request_id=uuid4(), content="   ")
    with pytest.raises(ValidationError):
        MessageCreate(request_id=uuid4(), content="x" * 16001)


def test_message_schema_rejects_unexpected_provider_fields() -> None:
    with pytest.raises(ValidationError):
        MessageCreate(request_id=uuid4(), content="Olá, D.A.R.V.I.S.", provider="gemini")


def test_message_schema_requires_uuid_request_id() -> None:
    with pytest.raises(ValidationError):
        MessageCreate(content="Olá")

    message = MessageCreate(
        request_id="0c0a9c1d-24b9-471b-a4bb-8a6a907c85a4",
        content="Olá",
    )
    assert str(message.request_id) == "0c0a9c1d-24b9-471b-a4bb-8a6a907c85a4"
