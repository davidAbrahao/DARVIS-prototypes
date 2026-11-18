"""Cria memória estruturada manual e isolada por proprietário."""

from alembic import op
import sqlalchemy as sa

revision = "0007_structured_memory"
down_revision = "0006_assistant_idempotency"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "memory_entries",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "user_id",
            sa.Integer(),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("title", sa.String(140), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("category", sa.String(24), nullable=False, server_default="fact"),
        sa.Column("tags", sa.JSON(), nullable=False, server_default="[]"),
        sa.Column("is_pinned", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("is_archived", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("source", sa.String(24), nullable=False, server_default="manual"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.CheckConstraint(
            "category IN ('fact', 'preference', 'goal', 'work', 'relationship', 'routine', 'other')",
            name="ck_memory_entries_category",
        ),
        sa.CheckConstraint("source = 'manual'", name="ck_memory_entries_source"),
    )
    op.create_index("ix_memory_entries_user_id", "memory_entries", ["user_id"])
    op.create_index(
        "ix_memory_entries_user_updated",
        "memory_entries",
        ["user_id", "updated_at"],
    )
    op.create_index(
        "ix_memory_entries_user_category",
        "memory_entries",
        ["user_id", "category"],
    )
    op.create_index(
        "ix_memory_entries_user_archived",
        "memory_entries",
        ["user_id", "is_archived"],
    )


def downgrade() -> None:
    op.drop_table("memory_entries")
