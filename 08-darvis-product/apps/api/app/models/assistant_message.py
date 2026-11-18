from datetime import datetime

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    ForeignKeyConstraint,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class AssistantMessage(Base):
    __tablename__ = "assistant_messages"
    __table_args__ = (
        CheckConstraint(
            "role IN ('user', 'assistant')",
            name="ck_assistant_messages_role",
        ),
        CheckConstraint(
            "(role = 'user' AND client_message_id IS NOT NULL) "
            "OR (role = 'assistant' AND client_message_id IS NULL)",
            name="ck_assistant_messages_client_id_role",
        ),
        UniqueConstraint(
            "conversation_id",
            "user_id",
            "client_message_id",
            name="uq_assistant_messages_client_id",
        ),
        ForeignKeyConstraint(
            ["conversation_id", "user_id"],
            ["assistant_conversations.id", "assistant_conversations.user_id"],
            name="fk_assistant_messages_conversation_owner",
            ondelete="CASCADE",
        ),
        Index(
            "ix_assistant_messages_conversation_created",
            "conversation_id",
            "created_at",
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    conversation_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    role: Mapped[str] = mapped_column(String(16), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    client_message_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    provider: Mapped[str | None] = mapped_column(String(40), nullable=True)
    model: Mapped[str | None] = mapped_column(String(120), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
