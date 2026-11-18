from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.user import utcnow


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    name: Mapped[str] = mapped_column(String(160))
    description: Mapped[str] = mapped_column(Text, default="")
    phase: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    milestones: Mapped[list["Milestone"]] = relationship(
        cascade="all, delete-orphan", order_by="Milestone.position", lazy="selectin"
    )

    @property
    def progress(self) -> int:
        total = len(self.milestones)
        return round(100 * sum(m.done for m in self.milestones) / total) if total else 0


class Milestone(Base):
    __tablename__ = "milestones"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id"), index=True)
    title: Mapped[str] = mapped_column(String(200))
    done: Mapped[bool] = mapped_column(Boolean, default=False)
    position: Mapped[int] = mapped_column(Integer, default=0)


class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    title: Mapped[str] = mapped_column(String(300))
    done: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    priority: Mapped[str] = mapped_column(String(10), default="media")
    project_id: Mapped[int | None] = mapped_column(ForeignKey("projects.id"), nullable=True, index=True)
    due_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class Note(Base):
    """Índice/cópia de trabalho de uma nota. Na Fase 6 o Vault (Obsidian) passa a ser a fonte
    da verdade do conteúdo; `vault_path` e `content_hash` já existem para essa sincronização."""

    __tablename__ = "notes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    title: Mapped[str] = mapped_column(String(200))
    body: Mapped[str] = mapped_column(Text, default="")
    category: Mapped[str] = mapped_column(String(32), default="ideia", index=True)
    pinned: Mapped[bool] = mapped_column(Boolean, default=False)
    source: Mapped[str] = mapped_column(String(32), default="manual")
    vault_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    content_hash: Mapped[str | None] = mapped_column(String(64), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)
    tag_rows: Mapped[list["NoteTag"]] = relationship(cascade="all, delete-orphan", lazy="selectin")

    @property
    def tags(self) -> list[str]:
        return sorted(r.tag for r in self.tag_rows)


class NoteTag(Base):
    __tablename__ = "note_tags"

    note_id: Mapped[int] = mapped_column(ForeignKey("notes.id"), primary_key=True)
    tag: Mapped[str] = mapped_column(String(48), primary_key=True, index=True)
