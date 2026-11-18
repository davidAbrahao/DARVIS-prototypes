from typing import Annotated

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.api.schemas.memory import (
    MemoryCategory,
    MemoryCreate,
    MemoryResponse,
    MemoryUpdate,
)
from app.db.session import get_db
from app.models.user import User
from app.services.memory import (
    create_memory,
    delete_memory,
    get_memory,
    list_memory,
    update_memory,
)

router = APIRouter(prefix="/memories", tags=["memória"])


@router.get("", response_model=list[MemoryResponse])
def get_memories(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
    category: Annotated[MemoryCategory | None, Query()] = None,
    query: Annotated[str | None, Query(min_length=2, max_length=120)] = None,
    include_archived: bool = False,
    limit: Annotated[int, Query(ge=1, le=100)] = 50,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> list[MemoryResponse]:
    return list_memory(
        db,
        user_id=current_user.id,
        category=category,
        query=query,
        include_archived=include_archived,
        limit=limit,
        offset=offset,
    )


@router.post("", response_model=MemoryResponse, status_code=status.HTTP_201_CREATED)
def post_memory(
    payload: MemoryCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> MemoryResponse:
    return create_memory(db, user_id=current_user.id, payload=payload)


@router.get("/{memory_id}", response_model=MemoryResponse)
def get_memory_by_id(
    memory_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> MemoryResponse:
    return get_memory(db, user_id=current_user.id, memory_id=memory_id)


@router.patch("/{memory_id}", response_model=MemoryResponse)
def patch_memory(
    memory_id: int,
    payload: MemoryUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> MemoryResponse:
    return update_memory(
        db,
        user_id=current_user.id,
        memory_id=memory_id,
        payload=payload,
    )


@router.delete("/{memory_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_memory(
    memory_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> Response:
    delete_memory(db, user_id=current_user.id, memory_id=memory_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
