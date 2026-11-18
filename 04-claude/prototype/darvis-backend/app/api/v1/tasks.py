from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import case, delete, select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.api.v1._common import owned_or_404, patch_data
from app.db.session import get_db
from app.models.knowledge import Project, Task
from app.models.user import User, utcnow
from app.schemas.knowledge import Priority, TaskCreate, TaskOut, TaskUpdate
from app.services.audit import record

router = APIRouter(prefix="/tasks", tags=["tasks"])


def _check_project(db: Session, user: User, project_id: int | None) -> None:
    if project_id is not None and not db.scalar(
        select(Project.id).where(Project.id == project_id, Project.user_id == user.id)
    ):
        raise HTTPException(400, "Projeto inexistente")


@router.get("", response_model=list[TaskOut])
def list_tasks(
    done: bool | None = None,
    priority: Priority | None = None,
    project_id: int | None = None,
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    stmt = select(Task).where(Task.user_id == user.id)
    if done is not None:
        stmt = stmt.where(Task.done.is_(done))
    if priority:
        stmt = stmt.where(Task.priority == priority)
    if project_id is not None:
        stmt = stmt.where(Task.project_id == project_id)
    rank = case((Task.priority == "alta", 0), (Task.priority == "media", 1), else_=2)
    return db.scalars(stmt.order_by(Task.done, rank, Task.id.desc()).limit(limit).offset(offset)).all()


@router.post("", response_model=TaskOut, status_code=status.HTTP_201_CREATED)
def create_task(body: TaskCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _check_project(db, user, body.project_id)
    task = Task(user_id=user.id, **body.model_dump())
    db.add(task)
    db.flush()
    record(db, "task_created", user_id=user.id, detail=str(task.id))
    db.commit()
    return task


@router.post("/clear-completed")
def clear_completed(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    n = db.execute(delete(Task).where(Task.user_id == user.id, Task.done.is_(True))).rowcount
    record(db, "tasks_cleared", user_id=user.id, detail=str(n))
    db.commit()
    return {"deleted": n}


@router.get("/{task_id}", response_model=TaskOut)
def get_task(task_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return owned_or_404(db, Task, task_id, user)


@router.patch("/{task_id}", response_model=TaskOut)
def update_task(task_id: int, body: TaskUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    task = owned_or_404(db, Task, task_id, user)
    data = patch_data(body, nullable={"project_id", "due_date"})
    if "project_id" in data:
        _check_project(db, user, data["project_id"])
    if "done" in data and data["done"] != task.done:
        task.completed_at = utcnow() if data["done"] else None
    for k, v in data.items():
        setattr(task, k, v)
    db.commit()
    return task


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(task_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    task = owned_or_404(db, Task, task_id, user)
    db.delete(task)
    record(db, "task_deleted", user_id=user.id, detail=str(task_id))
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
