from datetime import date, datetime
from typing import Annotated, Literal

from pydantic import AfterValidator, BaseModel, ConfigDict, Field

Priority = Literal["alta", "media", "baixa"]
Category = Literal["decisao", "ideia", "referencia", "pessoal"]


def _clean_tags(values: list[str]) -> list[str]:
    out: list[str] = []
    for t in values:
        t = t.strip().lower().lstrip("#")
        if t and len(t) <= 48 and t not in out:
            out.append(t)
    if len(out) > 20:
        raise ValueError("máximo de 20 tags por nota")
    return out


Tags = Annotated[list[str], AfterValidator(_clean_tags)]


class ORM(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# ---- Notas
class NoteCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    body: str = Field(default="", max_length=100_000)
    category: Category = "ideia"
    tags: Tags = []
    pinned: bool = False


class NoteUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    body: str | None = Field(default=None, max_length=100_000)
    category: Category | None = None
    tags: Tags | None = None
    pinned: bool | None = None


class NoteOut(ORM):
    id: int
    title: str
    body: str
    category: str
    tags: list[str]
    pinned: bool
    source: str
    created_at: datetime
    updated_at: datetime


# ---- Tarefas
class TaskCreate(BaseModel):
    title: str = Field(min_length=1, max_length=300)
    priority: Priority = "media"
    project_id: int | None = None
    due_date: date | None = None


class TaskUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=300)
    priority: Priority | None = None
    project_id: int | None = None
    due_date: date | None = None
    done: bool | None = None


class TaskOut(ORM):
    id: int
    title: str
    done: bool
    priority: str
    project_id: int | None
    due_date: date | None
    created_at: datetime
    completed_at: datetime | None


# ---- Projetos
class MilestoneCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)


class MilestoneUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    done: bool | None = None


class MilestoneOut(ORM):
    id: int
    title: str
    done: bool
    position: int


class ProjectCreate(BaseModel):
    name: str = Field(min_length=1, max_length=160)
    description: str = Field(default="", max_length=5000)
    phase: int | None = Field(default=None, ge=1, le=7)
    milestones: list[Annotated[str, Field(min_length=1, max_length=200)]] = []


class ProjectUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=160)
    description: str | None = Field(default=None, max_length=5000)
    phase: int | None = Field(default=None, ge=1, le=7)


class ProjectOut(ORM):
    id: int
    name: str
    description: str
    phase: int | None
    progress: int
    milestones: list[MilestoneOut]
    created_at: datetime


# ---- Dashboard
class PinnedNote(ORM):
    id: int
    title: str
    category: str


class Activity(ORM):
    action: str
    created_at: datetime


class DashboardOut(BaseModel):
    open_tasks: int
    done_tasks: int
    high_priority_open: int
    notes_total: int
    pinned_notes: list[PinnedNote]
    active_projects: int
    overall_progress: int
    recent_activity: list[Activity]
