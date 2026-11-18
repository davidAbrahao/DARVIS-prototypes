import pytest
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
        MessageCreate(content="   ")
    with pytest.raises(ValidationError):
        MessageCreate(content="x" * 16001)


def test_message_schema_rejects_unexpected_provider_fields() -> None:
    with pytest.raises(ValidationError):
        MessageCreate(content="Olá, D.A.R.V.I.S.", provider="gemini")
