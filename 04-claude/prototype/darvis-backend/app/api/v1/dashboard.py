from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.audit import AuditLog
from app.models.knowledge import Note, Project, Task
from app.models.user import User
from app.schemas.knowledge import DashboardOut

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("", response_model=DashboardOut)
def dashboard(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    def count(*where) -> int:
        return db.scalar(select(func.count()).where(*where)) or 0

    tasks = [Task.user_id == user.id]
    projects = db.scalars(select(Project).where(Project.user_id == user.id)).all()
    pinned = db.scalars(
        select(Note).where(Note.user_id == user.id, Note.pinned.is_(True)).order_by(Note.updated_at.desc()).limit(5)
    ).all()
    activity = db.scalars(
        select(AuditLog).where(AuditLog.user_id == user.id).order_by(AuditLog.id.desc()).limit(5)
    ).all()
    return DashboardOut(
        open_tasks=count(*tasks, Task.done.is_(False)),
        done_tasks=count(*tasks, Task.done.is_(True)),
        high_priority_open=count(*tasks, Task.done.is_(False), Task.priority == "alta"),
        notes_total=count(Note.user_id == user.id),
        pinned_notes=pinned,
        active_projects=sum(1 for p in projects if 0 < p.progress < 100),
        overall_progress=round(sum(p.progress for p in projects) / len(projects)) if projects else 0,
        recent_activity=activity,
    )
