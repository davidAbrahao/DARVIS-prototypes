from datetime import UTC, datetime, timedelta
from typing import Any

from fastapi import HTTPException
from sqlalchemy import select
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
    if "title" in changes and changes["title"] is None:
        raise HTTPException(status_code=422, detail="O título não pode ser nulo")
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
    project_rows = db.query(Project.status).filter(Project.user_id == user_id).all()
    task_rows = db.query(Task.status, Task.due_at).filter(Task.user_id == user_id).all()

    projects_active = sum(row.status == "active" for row in project_rows)
    tasks_completed = sum(row.status == "done" for row in task_rows)
    tasks_open = sum(row.status not in {"done", "cancelled"} for row in task_rows)
    tasks_due_soon = sum(
        row.due_at is not None and now <= row.due_at <= seven_days
        and row.status not in {"done", "cancelled"}
        for row in task_rows
    )
    return {
        "projects_total": len(project_rows),
        "projects_active": projects_active,
        "tasks_total": len(task_rows),
        "tasks_open": tasks_open,
        "tasks_completed": tasks_completed,
        "tasks_due_soon": tasks_due_soon,
    }
