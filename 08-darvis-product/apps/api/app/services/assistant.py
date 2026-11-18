import hmac
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
from app.services.assistant_context import build_context_preview
from app.services.auth import _consume_rate_limit
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
    for message in reversed(messages):
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


def _existing_idempotent_turn(
    db: Session,
    *,
    user_id: int,
    conversation_id: str,
    request_id: str,
    request_content: str,
    request_context_items: list[dict[str, object]],
    request_context_hash: str | None,
) -> list[AssistantMessage] | None:
    user_message = db.scalar(
        select(AssistantMessage).where(
            AssistantMessage.user_id == user_id,
            AssistantMessage.conversation_id == conversation_id,
            AssistantMessage.role == "user",
            AssistantMessage.client_message_id == request_id,
        )
    )
    if user_message is None:
        return None
    if (
        user_message.content != request_content
        or (user_message.context_items or []) != request_context_items
        or user_message.context_hash != request_context_hash
    ):
        raise HTTPException(
            status_code=409,
            detail=(
                "Este identificador de envio já foi utilizado com outra mensagem "
                "ou seleção de contexto."
            ),
        )

    assistant_message = db.scalar(
        select(AssistantMessage)
        .where(
            AssistantMessage.user_id == user_id,
            AssistantMessage.conversation_id == conversation_id,
            AssistantMessage.role == "assistant",
            AssistantMessage.id > user_message.id,
        )
        .order_by(AssistantMessage.id.asc())
        .limit(1)
    )
    if assistant_message is None:
        raise HTTPException(
            status_code=409,
            detail="O envio anterior está incompleto. Atualize a conversa antes de continuar.",
        )
    return [user_message, assistant_message]


def send_message(
    db: Session,
    *,
    user_id: int,
    conversation_id: str,
    payload: MessageCreate,
) -> list[AssistantMessage]:
    conversation = get_conversation(
        db, user_id=user_id, conversation_id=conversation_id
    )
    request_id = str(payload.request_id)
    context_items = [
        item.model_dump(mode="json")
        for item in payload.context_items
    ]
    context_hash = payload.context_hash
    existing_turn = _existing_idempotent_turn(
        db,
        user_id=user_id,
        conversation_id=conversation_id,
        request_id=request_id,
        request_content=payload.content,
        request_context_items=context_items,
        request_context_hash=context_hash,
    )
    if existing_turn is not None:
        return existing_turn

    context_text = ""
    if payload.context_items:
        preview = build_context_preview(
            db,
            user_id=user_id,
            items=payload.context_items,
        )
        if context_hash is None or not hmac.compare_digest(preview.context_hash, context_hash):
            raise HTTPException(
                status_code=409,
                detail=(
                    "Uma fonte selecionada mudou desde a prévia. "
                    "Gere uma nova prévia antes de enviar."
                ),
            )
        context_text = preview.context_text

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

    rate_limited = _consume_rate_limit(
        db,
        scope="assistant-user",
        value=str(user_id),
        limit=20,
        window_seconds=900,
        block_seconds=900,
    )
    db.commit()
    if rate_limited:
        db.add(
            AuditEvent(
                actor_user_id=user_id,
                event_type="assistant.generation.rate_limited",
                outcome="rate_limited",
                event_metadata={"reason": "limite_de_uso_do_assistente"},
            )
        )
        db.commit()
        raise HTTPException(
            status_code=429,
            detail="Limite temporário de uso do assistente atingido. Tente novamente mais tarde.",
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
    provider_prompt = (
        f"{context_text}\n\n[SOLICITAÇÃO ATUAL DO USUÁRIO]\n{payload.content}"
        if context_text
        else payload.content
    )
    turns = _build_history(list(reversed(history)), current_prompt=provider_prompt)

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
                    "context_count": len(context_items),
                    "context_source_types": sorted(
                        {str(item["source_type"]) for item in context_items}
                    ),
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
        # Uma solicitação concorrente com o mesmo request_id pode ter vencido.
        existing_turn = _existing_idempotent_turn(
            db,
            user_id=user_id,
            conversation_id=conversation_id,
            request_id=request_id,
            request_content=payload.content,
            request_context_items=context_items,
            request_context_hash=context_hash,
        )
        if existing_turn is not None:
            return existing_turn
        raise HTTPException(
            status_code=409,
            detail=(
                "A conversa foi alterada em outra solicitação. "
                "Atualize o histórico e tente novamente."
            ),
        )

    user_message = AssistantMessage(
        conversation_id=conversation_id,
        user_id=user_id,
        role="user",
        content=payload.content,
        client_message_id=request_id,
        context_items=context_items,
        context_hash=context_hash,
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
            "context_count": len(context_items),
            "context_source_types": sorted(
                {str(item["source_type"]) for item in context_items}
            ),
        },
    )
    db.commit()
    db.refresh(user_message)
    db.refresh(assistant_message)
    return [user_message, assistant_message]
