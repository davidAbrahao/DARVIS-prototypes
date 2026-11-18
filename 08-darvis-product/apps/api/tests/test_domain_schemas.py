import pytest
from pydantic import ValidationError

from app.api.schemas.projects import ProjectCreate, ProjectUpdate
from app.api.schemas.tasks import TaskCreate, TaskUpdate


def test_project_schema_requires_a_nonblank_name_and_rejects_unknown_fields() -> None:
    with pytest.raises(ValidationError):
        ProjectCreate(name="   ")
    with pytest.raises(ValidationError):
        ProjectCreate(name="Projeto válido", is_admin=True)


def test_project_update_allows_clearing_description_but_validates_status() -> None:
    payload = ProjectUpdate(description=None, status="on_hold")
    assert payload.model_dump(exclude_unset=True) == {
        "description": None,
        "status": "on_hold",
    }

    with pytest.raises(ValidationError):
        ProjectUpdate(status="in_progress")


def test_task_schema_enforces_status_priority_and_timezone() -> None:
    payload = TaskCreate(
        title="Tarefa válida",
        due_at="2026-12-01T10:00:00-03:00",
        priority="urgent",
    )
    assert payload.priority == "urgent"
    assert payload.due_at is not None and payload.due_at.tzinfo is not None

    with pytest.raises(ValidationError):
        TaskCreate(title="Tarefa sem fuso", due_at="2026-12-01T10:00:00")

    with pytest.raises(ValidationError):
        TaskCreate(title="Tarefa", status="finished")


def test_task_update_can_unlink_project_and_clear_due_date() -> None:
    payload = TaskUpdate(project_id=None, due_at=None, status="done")
    assert payload.model_dump(exclude_unset=True) == {
        "project_id": None,
        "due_at": None,
        "status": "done",
    }

    with pytest.raises(ValidationError):
        TaskUpdate(priority="critical")
