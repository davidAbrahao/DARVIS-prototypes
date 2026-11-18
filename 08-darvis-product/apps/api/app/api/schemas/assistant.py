from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


class ConversationCreate(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    title: str = Field(default="Nova conversa", min_length=1, max_length=120)

    @field_validator("title")
    @classmethod
    def title_must_not_be_blank(cls, value: str) -> str:
        if not value:
            raise ValueError("O título da conversa não pode ficar vazio")
        return value


class ConversationUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    title: str = Field(min_length=1, max_length=120)

    @field_validator("title")
    @classmethod
    def title_must_not_be_blank(cls, value: str) -> str:
        if not value:
            raise ValueError("O título da conversa não pode ficar vazio")
        return value


class ConversationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    created_at: datetime
    updated_at: datetime


ContextSourceType = Literal["memory", "project", "task"]


class ContextItem(BaseModel):
    model_config = ConfigDict(extra="forbid")

    source_type: ContextSourceType
    source_id: int = Field(gt=0, strict=True)


class ContextPreviewRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[ContextItem] = Field(min_length=1, max_length=8)

    @field_validator("items")
    @classmethod
    def items_must_be_unique(cls, value: list[ContextItem]) -> list[ContextItem]:
        keys = [(item.source_type, item.source_id) for item in value]
        if len(keys) != len(set(keys)):
            raise ValueError("Não selecione a mesma fonte mais de uma vez")
        return value


class ContextPreviewItem(BaseModel):
    source_type: ContextSourceType
    source_id: int
    title: str
    fields: dict[str, object]


class ContextPreviewResponse(BaseModel):
    items: list[ContextPreviewItem]
    context_text: str
    character_count: int
    context_hash: str


class MessageCreate(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    request_id: UUID
    content: str = Field(min_length=1, max_length=16000)
    context_items: list[ContextItem] = Field(default_factory=list, max_length=8)
    context_hash: str | None = Field(default=None, pattern="^[0-9a-f]{64}$")

    @model_validator(mode="after")
    def context_hash_must_match_selection_presence(self) -> "MessageCreate":
        keys = [(item.source_type, item.source_id) for item in self.context_items]
        if len(keys) != len(set(keys)):
            raise ValueError("Não selecione a mesma fonte mais de uma vez")
        if self.context_items and self.context_hash is None:
            raise ValueError("Gere uma prévia antes de enviar o contexto")
        if not self.context_items and self.context_hash is not None:
            raise ValueError("Hash de contexto sem fontes selecionadas")
        return self

    @field_validator("content")
    @classmethod
    def content_must_not_be_blank(cls, value: str) -> str:
        if not value:
            raise ValueError("A mensagem não pode ficar vazia")
        return value


class MessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    conversation_id: str
    role: Literal["user", "assistant"]
    content: str
    context_items: list[ContextItem] = Field(default_factory=list)
    context_hash: str | None = None
    provider: str | None
    model: str | None
    created_at: datetime


class AssistantStatusResponse(BaseModel):
    state: Literal["disabled", "missing_credentials", "configured"]
    provider: str | None
    model: str | None
    configured: bool
