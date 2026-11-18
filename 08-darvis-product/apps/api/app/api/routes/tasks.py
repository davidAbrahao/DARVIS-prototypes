from typing import Annotated

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.api.schemas.dashboard import DashboardSummary
from app.api.schemas.tasks import (
    TaskCreate,
    TaskPriority,
    TaskResponse,
    TaskStatus,
    TaskUpdate,
)
from app.db.session import get_db
from app.models.user import User
from app.services.tasks import (
    create_task,
    dashboard_summary,
    delete_task,
    get_task,
    list_tasks,
    update_task,
)

router = APIRouter(tags=["tarefas e painel"])


@router.get("/tasks", response_model=list[TaskResponse])
def get_tasks(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
    status_filter: Annotated[TaskStatus | None, Query(alias="status")] = None,
    project_id: Annotated[int | None, Query(gt=0)] = None,
    priority_filter: Annotated[TaskPriority | None, Query(alias="priority")] = None,
    limit: Annotated[int, Query(ge=1, le=100)] = 50,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> list[TaskResponse]:
    return list_tasks(
        db,
        user_id=current_user.id,
        status_filter=status_filter,
        project_id=project_id,
        priority_filter=priority_filter,
        limit=limit,
        offset=offset,
    )


@router.post("/tasks", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
def post_task(
    payload: TaskCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> TaskResponse:
    return create_task(db, user_id=current_user.id, payload=payload)


@router.get("/tasks/{task_id}", response_model=TaskResponse)
def get_task_by_id(
    task_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> TaskResponse:
    return get_task(db, user_id=current_user.id, task_id=task_id)


@router.patch("/tasks/{task_id}", response_model=TaskResponse)
def patch_task(
    task_id: int,
    payload: TaskUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> TaskResponse:
    return update_task(db, user_id=current_user.id, task_id=task_id, payload=payload)


@router.delete("/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_task(
    task_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> Response:
    delete_task(db, user_id=current_user.id, task_id=task_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/dashboard/summary", response_model=DashboardSummary)
def get_dashboard_summary(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> DashboardSummary:
    return DashboardSummary(**dashboard_summary(db, user_id=current_user.id))
