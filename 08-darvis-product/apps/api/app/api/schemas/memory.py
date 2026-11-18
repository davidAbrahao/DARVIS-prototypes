from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

MemoryCategory = Literal[
    "fact",
    "preference",
    "goal",
    "work",
    "relationship",
    "routine",
    "other",
]


def _normalize_tags(tags: list[str]) -> list[str]:
    normalized: list[str] = []
    seen: set[str] = set()
    for tag in tags:
        value = " ".join(tag.split()).lower()
        if not value:
            continue
        if len(value) > 32:
            raise ValueError("Cada etiqueta pode ter no máximo 32 caracteres")
        if value not in seen:
            seen.add(value)
            normalized.append(value)
    if len(normalized) > 12:
        raise ValueError("Cada registro pode ter no máximo 12 etiquetas")
    return normalized


class MemoryCreate(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    title: str = Field(min_length=1, max_length=140)
    content: str = Field(min_length=1, max_length=12000)
    category: MemoryCategory = "fact"
    tags: list[str] = Field(default_factory=list, max_length=12)
    is_pinned: bool = False

    @field_validator("title", "content")
    @classmethod
    def required_text_must_not_be_blank(cls, value: str) -> str:
        if not value:
            raise ValueError("O campo não pode ficar vazio")
        return value

    @field_validator("tags")
    @classmethod
    def normalize_tags(cls, value: list[str]) -> list[str]:
        return _normalize_tags(value)


class MemoryUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    title: str | None = Field(default=None, min_length=1, max_length=140)
    content: str | None = Field(default=None, min_length=1, max_length=12000)
    category: MemoryCategory | None = None
    tags: list[str] | None = Field(default=None, max_length=12)
    is_pinned: bool | None = None
    is_archived: bool | None = None

    @field_validator("title", "content")
    @classmethod
    def required_text_must_not_be_blank(cls, value: str | None) -> str | None:
        if value is not None and not value:
            raise ValueError("O campo não pode ficar vazio")
        return value

    @field_validator("tags")
    @classmethod
    def normalize_tags(cls, value: list[str] | None) -> list[str] | None:
        return _normalize_tags(value) if value is not None else None


class MemoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    content: str
    category: MemoryCategory
    tags: list[str]
    is_pinned: bool
    is_archived: bool
    source: Literal["manual"]
    created_at: datetime
    updated_at: datetime
