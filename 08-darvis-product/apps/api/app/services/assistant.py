from datetime import UTC, datetime
from uuid import uuid4

from fastapi import HTTPException
from sqlalchemy import select, update
from sqlalchemy.orm import Session

from app.api.schemas.assistant import ConversationCreate, ConversationUpdate, MessageCreate
from app.core.config import get_settings
from app.models.assistant_conversation import AssistantConversation
from app.models.assistant_message import AssistantMessage
from app.models.audit_event import AuditEvent
from app.services.providers import (
    ChatTurn,
    ProviderGenerationError,
    ProviderNotConfigured,
    get_chat_provider,
)

HISTORY_LIMIT = 20
MAX_HISTORY_CHARACTERS = 48_000
DEFAULT_CONVERSATION_TITLE = "Nova conversa"


def _record_event(
    db: Session,
    *,
    user_id: int,
    event_type: str,
    conversation_id: str,
    outcome: str = "success",
    metadata: dict | None = None,
) -> None:
    db.add(
        AuditEvent(
            actor_user_id=user_id,
            event_type=event_type,
            resource_type="assistant_conversation",
            resource_id=conversation_id,
            outcome=outcome,
            event_metadata=metadata or {},
        )
    )


def assistant_status() -> dict[str, str | bool | None]:
    settings = get_settings()
    if settings.ai_provider == "disabled":
        return {
            "state": "disabled",
            "provider": None,
            "model": None,
            "configured": False,
        }

    if settings.ai_provider == "gemini":
        configured = bool(settings.gemini_api_key.get_secret_value().strip())
        return {
            "state": "configured" if configured else "missing_credentials",
            "provider": "gemini",
            "model": settings.gemini_model if configured else None,
            "configured": configured,
        }

    return {
        "state": "disabled",
        "provider": None,
        "model": None,
        "configured": False,
    }


def list_conversations(
    db: Session, *, user_id: int, limit: int, offset: int
) -> list[AssistantConversation]:
    return list(
        db.scalars(
            select(AssistantConversation)
            .where(AssistantConversation.user_id == user_id)
            .order_by(
                AssistantConversation.updated_at.desc(),
                AssistantConversation.id.desc(),
            )
            .limit(limit)
            .offset(offset)
        ).all()
    )


def get_conversation(
    db: Session, *, user_id: int, conversation_id: str, lock: bool = False
) -> AssistantConversation:
    statement = select(AssistantConversation).where(
        AssistantConversation.id == conversation_id,
        AssistantConversation.user_id == user_id,
    )
    if lock:
        statement = statement.with_for_update()
    conversation = db.scalar(statement)
    if conversation is None:
        raise HTTPException(status_code=404, detail="Conversa não encontrada")
    return conversation


def create_conversation(
    db: Session, *, user_id: int, payload: ConversationCreate
) -> AssistantConversation:
    conversation = AssistantConversation(
        id=str(uuid4()),
        user_id=user_id,
        title=payload.title,
    )
    db.add(conversation)
    db.flush()
    _record_event(
        db,
        user_id=user_id,
        event_type="assistant.conversation.created",
        conversation_id=conversation.id,
    )
    db.commit()
    db.refresh(conversation)
    return conversation


def update_conversation(
    db: Session,
    *,
    user_id: int,
    conversation_id: str,
    payload: ConversationUpdate,
) -> AssistantConversation:
    conversation = get_conversation(
        db, user_id=user_id, conversation_id=conversation_id, lock=True
    )
    conversation.title = payload.title
    conversation.version += 1
    _record_event(
        db,
        user_id=user_id,
        event_type="assistant.conversation.renamed",
        conversation_id=conversation.id,
    )
    db.commit()
    db.refresh(conversation)
    return conversation


def delete_conversation(db: Session, *, user_id: int, conversation_id: str) -> None:
    conversation = get_conversation(
        db, user_id=user_id, conversation_id=conversation_id, lock=True
    )
    _record_event(
        db,
        user_id=user_id,
        event_type="assistant.conversation.deleted",
        conversation_id=conversation.id,
    )
    db.delete(conversation)
    db.commit()


def list_messages(
    db: Session,
    *,
    user_id: int,
    conversation_id: str,
    limit: int,
    offset: int,
) -> list[AssistantMessage]:
    get_conversation(db, user_id=user_id, conversation_id=conversation_id)
    rows = db.scalars(
        select(AssistantMessage)
        .where(
            AssistantMessage.user_id == user_id,
            AssistantMessage.conversation_id == conversation_id,
        )
        .order_by(AssistantMessage.id.desc())
        .limit(limit)
        .offset(offset)
    ).all()
    return list(reversed(rows))


def _build_history(
    messages: list[AssistantMessage], *, current_prompt: str
) -> list[ChatTurn]:
    remaining = max(0, MAX_HISTORY_CHARACTERS - len(current_prompt))
    selected: list[ChatTurn] = []
    for message in messages:
        if remaining <= 0:
            break
        content = message.content
        if len(content) > remaining:
            content = content[-remaining:]
        selected.append(ChatTurn(role=message.role, content=content))
        remaining -= len(content)
    selected.reverse()
    selected.append(ChatTurn(role="user", content=current_prompt))
    return selected


def _first_title(prompt: str) -> str:
    normalized = " ".join(prompt.split())
    if len(normalized) <= 72:
        return normalized or DEFAULT_CONVERSATION_TITLE
    return f"{normalized[:69].rstrip()}..."


def send_message(
    db: Session,
    *,
    user_id: int,
    conversation_id: str,
    payload: MessageCreate,
) -> list[AssistantMessage]:
    try:
        provider = get_chat_provider()
    except ProviderNotConfigured:
        raise HTTPException(
            status_code=503,
            detail=(
                "O assistente ainda não está configurado. "
                "Habilite um provedor e configure a credencial no servidor."
            ),
        ) from None

    conversation = get_conversation(
        db, user_id=user_id, conversation_id=conversation_id
    )
    base_version = conversation.version
    original_title = conversation.title
    history = list(
        db.scalars(
            select(AssistantMessage)
            .where(
                AssistantMessage.user_id == user_id,
                AssistantMessage.conversation_id == conversation_id,
            )
            .order_by(AssistantMessage.id.desc())
            .limit(HISTORY_LIMIT)
        ).all()
    )
    turns = _build_history(list(reversed(history)), current_prompt=payload.content)

    # Libera a transação e a conexão durante a chamada de rede ao provedor.
    db.rollback()

    try:
        generated = provider.generate(turns)
    except ProviderGenerationError:
        db.add(
            AuditEvent(
                actor_user_id=user_id,
                event_type="assistant.generation.failed",
                resource_type="assistant_conversation",
                resource_id=conversation_id,
                outcome="provider_error",
                event_metadata={
                    "provider": provider.provider_name,
                    "model": provider.model_name,
                },
            )
        )
        db.commit()
        raise HTTPException(
            status_code=502,
            detail="O provedor de IA não conseguiu concluir a resposta. Tente novamente.",
        ) from None

    now = datetime.now(UTC)
    new_title = (
        _first_title(payload.content)
        if original_title == DEFAULT_CONVERSATION_TITLE and not history
        else original_title
    )
    claimed = db.execute(
        update(AssistantConversation)
        .where(
            AssistantConversation.id == conversation_id,
            AssistantConversation.user_id == user_id,
            AssistantConversation.version == base_version,
        )
        .values(
            version=AssistantConversation.version + 1,
            title=new_title,
            updated_at=now,
        )
    )
    if claimed.rowcount != 1:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="A conversa foi alterada em outra solicitação. Atualize o histórico e tente novamente.",
        )

    user_message = AssistantMessage(
        conversation_id=conversation_id,
        user_id=user_id,
        role="user",
        content=payload.content,
    )
    assistant_message = AssistantMessage(
        conversation_id=conversation_id,
        user_id=user_id,
        role="assistant",
        content=generated.content,
        provider=generated.provider,
        model=generated.model,
    )
    db.add_all([user_message, assistant_message])
    _record_event(
        db,
        user_id=user_id,
        event_type="assistant.exchange.completed",
        conversation_id=conversation_id,
        metadata={
            "provider": generated.provider,
            "model": generated.model,
            "input_characters": len(payload.content),
            "output_characters": len(generated.content),
        },
    )
    db.commit()
    db.refresh(user_message)
    db.refresh(assistant_message)
    return [user_message, assistant_message]
