from datetime import UTC, datetime, timedelta
from typing import Any

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.schemas.tasks import TaskCreate, TaskUpdate
from app.models.audit_event import AuditEvent
from app.models.project import Project
from app.models.task import Task


def list_tasks(
    db: Session,
    *,
    user_id: int,
    status_filter: str | None,
    project_id: int | None,
    priority_filter: str | None,
    limit: int,
    offset: int,
) -> list[Task]:
    statement = select(Task).where(Task.user_id == user_id)
    if status_filter:
        statement = statement.where(Task.status == status_filter)
    if project_id is not None:
        statement = statement.where(Task.project_id == project_id)
    if priority_filter:
        statement = statement.where(Task.priority == priority_filter)
    return list(
        db.scalars(
            statement.order_by(Task.updated_at.desc(), Task.id.desc())
            .limit(limit)
            .offset(offset)
        ).all()
    )


def get_task(db: Session, *, user_id: int, task_id: int) -> Task:
    task = db.scalar(select(Task).where(Task.id == task_id, Task.user_id == user_id))
    if task is None:
        raise HTTPException(status_code=404, detail="Tarefa não encontrada")
    return task


def _validate_project_owner(db: Session, *, user_id: int, project_id: int | None) -> None:
    if project_id is None:
        return
    project_exists = db.scalar(
        select(Project.id).where(Project.id == project_id, Project.user_id == user_id)
    )
    if project_exists is None:
        raise HTTPException(status_code=404, detail="Projeto não encontrado")


def _record_task_event(
    db: Session, *, user_id: int, event_type: str, task_id: int
) -> None:
    db.add(
        AuditEvent(
            actor_user_id=user_id,
            event_type=event_type,
            resource_type="task",
            resource_id=str(task_id),
            outcome="success",
            event_metadata={},
        )
    )


def create_task(db: Session, *, user_id: int, payload: TaskCreate) -> Task:
    _validate_project_owner(db, user_id=user_id, project_id=payload.project_id)
    values = payload.model_dump()
    now = datetime.now(UTC)
    task = Task(
        user_id=user_id,
        **values,
        completed_at=now if values["status"] == "done" else None,
    )
    db.add(task)
    db.flush()
    _record_task_event(db, user_id=user_id, event_type="task.created", task_id=task.id)
    db.commit()
    db.refresh(task)
    return task


def update_task(db: Session, *, user_id: int, task_id: int, payload: TaskUpdate) -> Task:
    task = get_task(db, user_id=user_id, task_id=task_id)
    changes: dict[str, Any] = payload.model_dump(exclude_unset=True)
    for field in ("title", "status", "priority"):
        if field in changes and changes[field] is None:
            raise HTTPException(status_code=422, detail=f"O campo {field} não pode ser nulo")
    if "project_id" in changes:
        _validate_project_owner(db, user_id=user_id, project_id=changes["project_id"])

    for field, value in changes.items():
        if field == "status":
            if value == "done" and task.status != "done":
                task.completed_at = datetime.now(UTC)
            elif value != "done":
                task.completed_at = None
        setattr(task, field, value)

    _record_task_event(db, user_id=user_id, event_type="task.updated", task_id=task.id)
    db.commit()
    db.refresh(task)
    return task


def delete_task(db: Session, *, user_id: int, task_id: int) -> None:
    task = get_task(db, user_id=user_id, task_id=task_id)
    _record_task_event(db, user_id=user_id, event_type="task.deleted", task_id=task.id)
    db.delete(task)
    db.commit()


def dashboard_summary(db: Session, *, user_id: int) -> dict[str, int]:
      now = datetime.now(UTC)
    seven_days = now + timedelta(days=7)

    project_total, project_active = db.execute(
        select(
            func.count(Project.id),
            func.count(Project.id).filter(Project.status == "active"),
        ).where(Project.user_id == user_id)
    ).one()

    task_total, task_open, task_completed, task_due_soon = db.execute(
        select(
            func.count(Task.id),
            func.count(Task.id).filter(Task.status.not_in(("done", "cancelled"))),
            func.count(Task.id).filter(Task.status == "done"),
            func.count(Task.id).filter(
                Task.due_at.is_not(None),
                Task.due_at >= now,
                Task.due_at <= seven_days,
                Task.status.not_in(("done", "cancelled")),
            ),
        ).where(Task.user_id == user_id)
    ).one()

    return {
        "projects_total": int(project_total or 0),
        "projects_active": int(project_active or 0),
        "tasks_total": int(task_total or 0),
        "tasks_open": int(task_open or 0),
        "tasks_completed": int(task_completed or 0),
        "tasks_due_soon": int(task_due_soon or 0),
    }
