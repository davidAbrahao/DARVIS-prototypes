from typing import Any

from fastapi import HTTPException
from sqlalchemy import select, update
from sqlalchemy.orm import Session

from app.api.schemas.projects import ProjectCreate, ProjectUpdate
from app.models.audit_event import AuditEvent
from app.models.project import Project
from app.models.task import Task


def list_projects(
    db: Session, *, user_id: int, status_filter: str | None, limit: int, offset: int
) -> list[Project]:
    statement = select(Project).where(Project.user_id == user_id)
    if status_filter:
        statement = statement.where(Project.status == status_filter)
    return list(
        db.scalars(
            statement.order_by(Project.updated_at.desc(), Project.id.desc())
            .limit(limit)
            .offset(offset)
        ).all()
    )


def get_project(
    db: Session, *, user_id: int, project_id: int, lock: bool = False
) -> Project:
    statement = select(Project).where(
        Project.id == project_id, Project.user_id == user_id
    )
    if lock:
        statement = statement.with_for_update()
    project = db.scalar(statement)
    if project is None:
        raise HTTPException(status_code=404, detail="Projeto não encontrado")
    return project


def _record_project_event(
    db: Session, *, user_id: int, event_type: str, project_id: int, outcome: str = "success"
) -> None:
    db.add(
        AuditEvent(
            actor_user_id=user_id,
            event_type=event_type,
            resource_type="project",
            resource_id=str(project_id),
            outcome=outcome,
            event_metadata={},
        )
    )


def create_project(db: Session, *, user_id: int, payload: ProjectCreate) -> Project:
    project = Project(user_id=user_id, **payload.model_dump())
    db.add(project)
    db.flush()
    _record_project_event(
        db, user_id=user_id, event_type="project.created", project_id=project.id
    )
    db.commit()
    db.refresh(project)
    return project


def update_project(
    db: Session, *, user_id: int, project_id: int, payload: ProjectUpdate
) -> Project:
    project = get_project(db, user_id=user_id, project_id=project_id)
    changes: dict[str, Any] = payload.model_dump(exclude_unset=True)
    if not changes:
        raise HTTPException(status_code=422, detail="Informe ao menos um campo para atualizar")
    for field in ("name", "status"):
        if field in changes and changes[field] is None:
            raise HTTPException(status_code=422, detail=f"O campo {field} não pode ser nulo")
    for field, value in changes.items():
        setattr(project, field, value)
    _record_project_event(
        db, user_id=user_id, event_type="project.updated", project_id=project.id
    )
    db.commit()
    db.refresh(project)
    return project


def delete_project(db: Session, *, user_id: int, project_id: int) -> None:
    project = get_project(db, user_id=user_id, project_id=project_id, lock=True)
    # A chave estrangeira composta exige desvincular as tarefas do mesmo proprietário.
    db.execute(
        update(Task)
        .where(Task.project_id == project.id, Task.user_id == user_id)
        .values(project_id=None)
    )
    _record_project_event(
        db, user_id=user_id, event_type="project.deleted", project_id=project.id
    )
    db.delete(project)
    db.commit()
