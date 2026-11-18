from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

TaskStatus = Literal["todo", "in_progress", "blocked", "done", "cancelled"]
TaskPriority = Literal["low", "normal", "high", "urgent"]


class TaskCreate(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    title: str = Field(min_length=1, max_length=180)
    description: str | None = Field(default=None, max_length=5000)
    project_id: int | None = Field(default=None, gt=0)
    status: TaskStatus = "todo"
    priority: TaskPriority = "normal"
    due_at: datetime | None = None

    @field_validator("title")
    @classmethod
    def title_must_not_be_blank(cls, value: str) -> str:
        if not value:
            raise ValueError("Título da tarefa não pode ficar vazio")
        return value


class TaskUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    title: str | None = Field(default=None, min_length=1, max_length=180)
    description: str | None = Field(default=None, max_length=5000)
    project_id: int | None = Field(default=None, gt=0)
    status: TaskStatus | None = None
    priority: TaskPriority | None = None
    due_at: datetime | None = None

    @field_validator("title")
    @classmethod
    def title_must_not_be_blank(cls, value: str | None) -> str | None:
        if value is not None and not value:
            raise ValueError("Título da tarefa não pode ficar vazio")
        return value


class TaskResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    project_id: int | None
    title: str
    description: str | None
    status: TaskStatus
    priority: TaskPriority
    due_at: datetime | None
    completed_at: datetime | None
    created_at: datetime
    updated_at: datetime
