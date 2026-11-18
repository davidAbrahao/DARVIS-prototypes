from typing import Annotated

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.api.schemas.assistant import (
    AssistantStatusResponse,
    ContextPreviewRequest,
    ContextPreviewResponse,
    ConversationCreate,
    ConversationResponse,
    ConversationUpdate,
    MessageCreate,
    MessageResponse,
)
from app.db.session import get_db
from app.models.user import User
from app.services.assistant import (
    assistant_status,
    create_conversation,
    delete_conversation,
    list_conversations,
    list_messages,
    send_message,
    update_conversation,
)
from app.services.assistant_context import build_context_preview

router = APIRouter(prefix="/assistant", tags=["assistente"])


@router.post(
    "/context-preview",
    response_model=ContextPreviewResponse,
)
def post_context_preview(
    payload: ContextPreviewRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> ContextPreviewResponse:
    return build_context_preview(
        db,
        user_id=current_user.id,
        items=payload.items,
    )


@router.get("/status", response_model=AssistantStatusResponse)
def get_assistant_status(
    current_user: Annotated[User, Depends(get_current_user)],
) -> AssistantStatusResponse:
    return AssistantStatusResponse(**assistant_status())


@router.get("/conversations", response_model=list[ConversationResponse])
def get_conversations(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
    limit: Annotated[int, Query(ge=1, le=100)] = 30,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> list[ConversationResponse]:
    return list_conversations(
        db, user_id=current_user.id, limit=limit, offset=offset
    )


@router.post(
    "/conversations",
    response_model=ConversationResponse,
    status_code=status.HTTP_201_CREATED,
)
def post_conversation(
    payload: ConversationCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> ConversationResponse:
    return create_conversation(db, user_id=current_user.id, payload=payload)


@router.patch(
    "/conversations/{conversation_id}",
    response_model=ConversationResponse,
)
def patch_conversation(
    conversation_id: str,
    payload: ConversationUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> ConversationResponse:
    return update_conversation(
        db,
        user_id=current_user.id,
        conversation_id=conversation_id,
        payload=payload,
    )


@router.delete(
    "/conversations/{conversation_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def remove_conversation(
    conversation_id: str,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> Response:
    delete_conversation(
        db,
        user_id=current_user.id,
        conversation_id=conversation_id,
    )
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get(
    "/conversations/{conversation_id}/messages",
    response_model=list[MessageResponse],
)
def get_messages(
    conversation_id: str,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
    limit: Annotated[int, Query(ge=1, le=100)] = 50,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> list[MessageResponse]:
    return list_messages(
        db,
        user_id=current_user.id,
        conversation_id=conversation_id,
        limit=limit,
        offset=offset,
    )


@router.post(
    "/conversations/{conversation_id}/messages",
    response_model=list[MessageResponse],
    status_code=status.HTTP_201_CREATED,
)
def post_message(
    conversation_id: str,
    payload: MessageCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> list[MessageResponse]:
    return send_message(
        db,
        user_id=current_user.id,
        conversation_id=conversation_id,
        payload=payload,
    )
