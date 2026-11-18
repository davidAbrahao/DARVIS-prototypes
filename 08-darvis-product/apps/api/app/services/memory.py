from typing import Any

from fastapi import HTTPException
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.api.schemas.memory import MemoryCreate, MemoryUpdate
from app.models.audit_event import AuditEvent
from app.models.memory_entry import MemoryEntry


def list_memory(
    db: Session,
    *,
    user_id: int,
    category: str | None,
    query: str | None,
    include_archived: bool,
    limit: int,
    offset: int,
) -> list[MemoryEntry]:
    statement = select(MemoryEntry).where(MemoryEntry.user_id == user_id)

    if not include_archived:
        statement = statement.where(MemoryEntry.is_archived.is_(False))
    if category:
        statement = statement.where(MemoryEntry.category == category)
    if query:
        pattern = f"%{query.strip()}%"
        statement = statement.where(
            or_(
                MemoryEntry.title.ilike(pattern),
                MemoryEntry.content.ilike(pattern),
            )
        )

    return list(
        db.scalars(
            statement.order_by(
                MemoryEntry.is_pinned.desc(),
                MemoryEntry.updated_at.desc(),
                MemoryEntry.id.desc(),
            )
            .limit(limit)
            .offset(offset)
        ).all()
    )


def get_memory(
    db: Session, *, user_id: int, memory_id: int, lock: bool = False
) -> MemoryEntry:
    statement = select(MemoryEntry).where(
        MemoryEntry.id == memory_id,
        MemoryEntry.user_id == user_id,
    )
    if lock:
        statement = statement.with_for_update()
    memory = db.scalar(statement)
    if memory is None:
        raise HTTPException(status_code=404, detail="Registro de memória não encontrado")
    return memory


def _record_memory_event(
    db: Session,
    *,
    user_id: int,
    event_type: str,
    memory_id: int,
    metadata: dict[str, Any] | None = None,
) -> None:
    db.add(
        AuditEvent(
            actor_user_id=user_id,
            event_type=event_type,
            resource_type="memory_entry",
            resource_id=str(memory_id),
            outcome="success",
            event_metadata=metadata or {},
        )
    )


def create_memory(
    db: Session, *, user_id: int, payload: MemoryCreate
) -> MemoryEntry:
    memory = MemoryEntry(
        user_id=user_id,
        source="manual",
        **payload.model_dump(),
    )
    db.add(memory)
    db.flush()
    _record_memory_event(
        db,
        user_id=user_id,
        event_type="memory.created",
        memory_id=memory.id,
        metadata={"category": memory.category},
    )
    db.commit()
    db.refresh(memory)
    return memory


def update_memory(
    db: Session,
    *,
    user_id: int,
    memory_id: int,
    payload: MemoryUpdate,
) -> MemoryEntry:
    memory = get_memory(db, user_id=user_id, memory_id=memory_id, lock=True)
    changes = payload.model_dump(exclude_unset=True)
    if not changes:
        raise HTTPException(
            status_code=422,
            detail="Informe ao menos um campo para atualizar",
        )

    for field in ("title", "content", "category", "tags", "is_pinned", "is_archived"):
        if field in changes and changes[field] is None:
            raise HTTPException(
                status_code=422,
                detail=f"O campo {field} não pode ser nulo",
            )

    for field, value in changes.items():
        setattr(memory, field, value)

    _record_memory_event(
        db,
        user_id=user_id,
        event_type="memory.updated",
        memory_id=memory.id,
        metadata={"fields": sorted(changes)},
    )
    db.commit()
    db.refresh(memory)
    return memory


def delete_memory(db: Session, *, user_id: int, memory_id: int) -> None:
    memory = get_memory(db, user_id=user_id, memory_id=memory_id, lock=True)
    _record_memory_event(
        db,
        user_id=user_id,
        event_type="memory.deleted",
        memory_id=memory.id,
        metadata={"category": memory.category},
    )
    db.delete(memory)
    db.commit()
