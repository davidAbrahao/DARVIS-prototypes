import os
from collections.abc import Generator
from datetime import UTC, datetime, timedelta

import pytest
from fastapi import HTTPException
from sqlalchemy import create_engine, select
from sqlalchemy.engine import make_url
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.schemas.projects import ProjectCreate, ProjectUpdate
from app.api.schemas.tasks import TaskCreate, TaskUpdate
from app.core.config import get_settings
from app.core.security import hash_password
from app.db.base import Base
from app.models import AuditEvent, Task, User
from app.services.projects import (
    create_project,
    delete_project,
    get_project,
    list_projects,
    update_project,
)
from app.services.tasks import (
    create_task,
    dashboard_summary,
    delete_task,
    get_task,
    list_tasks,
    update_task,
)

TEST_DATABASE_URL = os.getenv("TEST_DATABASE_URL")
if TEST_DATABASE_URL:
    test_database_url = make_url(TEST_DATABASE_URL)
    if (
        test_database_url.get_backend_name() != "postgresql"
        or not (test_database_url.database or "").endswith("_test")
    ):
        raise RuntimeError(
            "Os testes de integração só podem usar PostgreSQL com nome terminado em _test; "
            "o fixture apaga registros do banco de teste."
        )
pytestmark = pytest.mark.skipif(
    not TEST_DATABASE_URL,
    reason="Defina TEST_DATABASE_URL para executar os testes de domínio PostgreSQL",
)


@pytest.fixture
def db_session() -> Generator[Session, None, None]:
    engine = create_engine(TEST_DATABASE_URL, pool_pre_ping=True)
    connection = engine.connect()
    transaction = connection.begin()
    for table in reversed(Base.metadata.sorted_tables):
        connection.execute(table.delete())
    session = Session(bind=connection, join_transaction_mode="create_savepoint")
    try:
        yield session
    finally:
        session.close()
        transaction.rollback()
        connection.close()
        engine.dispose()


def _create_owner(db: Session) -> User:
    from app.services.auth import setup_owner

    result = setup_owner(
        db,
        email="dominio@darvis.test",
        full_name="D.A.R.V.I.S. Teste",
        password="senha-de-integracao-segura",
        setup_token=get_settings().initial_setup_token.get_secret_value(),
        ip_address="192.0.2.90",
    )
    return result.user


def test_project_and_task_lifecycle_updates_dashboard_and_audit(db_session: Session) -> None:
    owner = _create_owner(db_session)
    project = create_project(
        db_session,
        user_id=owner.id,
        payload=ProjectCreate(name="Entrega do cockpit", description="Primeira entrega real"),
    )
    assert project.status == "active"

    due_at = datetime.now(UTC) + timedelta(days=3)
    task = create_task(
        db_session,
        user_id=owner.id,
        payload=TaskCreate(
            title="Conectar projetos à API",
            project_id=project.id,
            due_at=due_at,
            priority="high",
        ),
    )
    assert task.project_id == project.id
    assert task.completed_at is None

    task = update_task(
        db_session,
        user_id=owner.id,
        task_id=task.id,
        payload=TaskUpdate(status="done"),
    )
    assert task.status == "done"
    assert task.completed_at is not None

    project = update_project(
        db_session,
        user_id=owner.id,
        project_id=project.id,
        payload=ProjectUpdate(status="completed"),
    )
    assert project.status == "completed"

    summary = dashboard_summary(db_session, user_id=owner.id)
    assert summary == {
        "projects_total": 1,
        "projects_active": 0,
        "tasks_total": 1,
        "tasks_open": 0,
        "tasks_completed": 1,
        "tasks_due_soon": 0,
    }

    events = db_session.scalars(
        select(AuditEvent).where(AuditEvent.actor_user_id == owner.id)
    ).all()
    assert {event.event_type for event in events} >= {
        "project.created",
        "project.updated",
        "task.created",
        "task.updated",
    }


def test_project_and_task_queries_are_scoped_to_the_authenticated_owner(
    db_session: Session,
) -> None:
    owner = _create_owner(db_session)
    another_user = User(
        email="outro-proprietario@darvis.test",
        full_name="Outro proprietário",
        password_hash=hash_password("outra-senha-de-integracao"),
    )
    db_session.add(another_user)
    db_session.flush()

    foreign_project = create_project(
        db_session,
        user_id=another_user.id,
        payload=ProjectCreate(name="Projeto privado de outra conta"),
    )

    with pytest.raises(HTTPException) as project_error:
        get_project(db_session, user_id=owner.id, project_id=foreign_project.id)
    assert project_error.value.status_code == 404

    with pytest.raises(HTTPException) as task_error:
        create_task(
            db_session,
            user_id=owner.id,
            payload=TaskCreate(
                title="Vínculo não autorizado",
                project_id=foreign_project.id,
            ),
        )
    assert task_error.value.status_code == 404

    assert list_projects(
        db_session, user_id=owner.id, status_filter=None, limit=50, offset=0
    ) == []
    assert list_tasks(
        db_session,
        user_id=owner.id,
        status_filter=None,
        project_id=None,
        priority_filter=None,
        limit=50,
        offset=0,
    ) == []


def test_deleting_project_unlinks_its_tasks_and_task_delete_is_scoped(
    db_session: Session,
) -> None:
    owner = _create_owner(db_session)
    project = create_project(
        db_session, user_id=owner.id, payload=ProjectCreate(name="Projeto removível")
    )
    task = create_task(
        db_session,
        user_id=owner.id,
        payload=TaskCreate(title="Tarefa preservada", project_id=project.id),
    )

    delete_project(db_session, user_id=owner.id, project_id=project.id)
    db_session.refresh(task)
    assert task.project_id is None

    delete_task(db_session, user_id=owner.id, task_id=task.id)
    with pytest.raises(HTTPException) as error:
        get_task(db_session, user_id=owner.id, task_id=task.id)
    assert error.value.status_code == 404


def test_update_cannot_set_required_task_fields_to_null(db_session: Session) -> None:
    owner = _create_owner(db_session)
    task = create_task(
        db_session, user_id=owner.id, payload=TaskCreate(title="Tarefa válida")
    )

    with pytest.raises(HTTPException) as error:
        update_task(
            db_session,
            user_id=owner.id,
            task_id=task.id,
            payload=TaskUpdate(status=None),
        )
    assert error.value.status_code == 422


def test_empty_patch_is_rejected_for_projects_and_tasks(db_session: Session) -> None:
    owner = _create_owner(db_session)
    project = create_project(
        db_session, user_id=owner.id, payload=ProjectCreate(name="Projeto para patch")
    )
    task = create_task(
        db_session, user_id=owner.id, payload=TaskCreate(title="Tarefa para patch")
    )

    with pytest.raises(HTTPException) as project_error:
        update_project(
            db_session,
            user_id=owner.id,
            project_id=project.id,
            payload=ProjectUpdate(),
        )
    with pytest.raises(HTTPException) as task_error:
        update_task(
            db_session,
            user_id=owner.id,
            task_id=task.id,
            payload=TaskUpdate(),
        )

    assert project_error.value.status_code == 422
    assert task_error.value.status_code == 422


def test_database_rejects_task_link_to_another_owners_project(db_session: Session) -> None:
    owner = _create_owner(db_session)
    another_user = User(
        email="projeto-alheio@darvis.test",
        full_name="Outro proprietário",
        password_hash=hash_password("outra-senha-segura"),
    )
    db_session.add(another_user)
    db_session.flush()

    foreign_project = create_project(
        db_session,
        user_id=another_user.id,
        payload=ProjectCreate(name="Projeto de outra pessoa"),
    )

    nested = db_session.begin_nested()
    db_session.add(
        Task(
            user_id=owner.id,
            project_id=foreign_project.id,
            title="Vínculo inválido",
        )
    )
    with pytest.raises(IntegrityError):
        db_session.flush()
    nested.rollback()
