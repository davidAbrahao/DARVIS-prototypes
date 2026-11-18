from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select, update
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.api.v1._common import owned_or_404, patch_data
from app.db.session import get_db
from app.models.knowledge import Milestone, Project, Task
from app.models.user import User
from app.schemas.knowledge import (
    MilestoneCreate, MilestoneOut, MilestoneUpdate, ProjectCreate, ProjectOut, ProjectUpdate,
)
from app.services.audit import record

router = APIRouter(prefix="/projects", tags=["projects"])


def _milestone_or_404(project: Project, milestone_id: int) -> Milestone:
    m = next((m for m in project.milestones if m.id == milestone_id), None)
    if m is None:
        raise HTTPException(404, "Marco não encontrado")
    return m


@router.get("", response_model=list[ProjectOut])
def list_projects(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.scalars(select(Project).where(Project.user_id == user.id).order_by(Project.phase, Project.id)).all()


@router.post("", response_model=ProjectOut, status_code=status.HTTP_201_CREATED)
def create_project(body: ProjectCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    project = Project(user_id=user.id, name=body.name, description=body.description, phase=body.phase)
    project.milestones = [Milestone(title=t, position=i) for i, t in enumerate(body.milestones)]
    db.add(project)
    db.flush()
    record(db, "project_created", user_id=user.id, detail=str(project.id))
    db.commit()
    return project


@router.get("/{project_id}", response_model=ProjectOut)
def get_project(project_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return owned_or_404(db, Project, project_id, user)


@router.patch("/{project_id}", response_model=ProjectOut)
def update_project(project_id: int, body: ProjectUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    project = owned_or_404(db, Project, project_id, user)
    for k, v in patch_data(body, nullable={"phase"}).items():
        setattr(project, k, v)
    db.commit()
    return project


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(project_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    project = owned_or_404(db, Project, project_id, user)
    db.execute(update(Task).where(Task.project_id == project.id).values(project_id=None))  # tarefas ficam, sem projeto
    db.delete(project)
    record(db, "project_deleted", user_id=user.id, detail=str(project_id))
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/{project_id}/milestones", response_model=MilestoneOut, status_code=status.HTTP_201_CREATED)
def add_milestone(project_id: int, body: MilestoneCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    project = owned_or_404(db, Project, project_id, user)
    m = Milestone(title=body.title, position=len(project.milestones))
    project.milestones.append(m)
    db.commit()
    return m


@router.patch("/{project_id}/milestones/{milestone_id}", response_model=MilestoneOut)
def update_milestone(project_id: int, milestone_id: int, body: MilestoneUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    m = _milestone_or_404(owned_or_404(db, Project, project_id, user), milestone_id)
    for k, v in patch_data(body).items():
        setattr(m, k, v)
    db.commit()
    return m


@router.delete("/{project_id}/milestones/{milestone_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_milestone(project_id: int, milestone_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    project = owned_or_404(db, Project, project_id, user)
    project.milestones.remove(_milestone_or_404(project, milestone_id))
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
