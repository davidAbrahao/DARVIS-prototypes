"""Adiciona metadados de contexto explícito às mensagens."""

import sqlalchemy as sa

from alembic import op

revision = "0008_explicit_assistant_context"
down_revision = "0007_structured_memory"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "assistant_messages",
        sa.Column(
            "context_items",
            sa.JSON(),
            nullable=False,
            server_default="[]",
        ),
    )
    op.add_column(
        "assistant_messages",
        sa.Column("context_hash", sa.String(length=64), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("assistant_messages", "context_hash")
    op.drop_column("assistant_messages", "context_items")
