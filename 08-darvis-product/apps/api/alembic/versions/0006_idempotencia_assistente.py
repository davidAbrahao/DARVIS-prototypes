"""Adiciona chave de idempotência ao envio de mensagens."""

import sqlalchemy as sa

from alembic import op

revision = "0006_assistant_idempotency"
down_revision = "0005_assistant_conversations"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "assistant_messages",
        sa.Column("client_message_id", sa.String(36), nullable=True),
    )
    op.create_check_constraint(
        "ck_assistant_messages_client_id_role",
        "assistant_messages",
        "role = 'user' OR client_message_id IS NULL",
    )
    op.create_unique_constraint(
        "uq_assistant_messages_client_id",
        "assistant_messages",
        ["conversation_id", "user_id", "client_message_id"],
    )


def downgrade() -> None:
    op.drop_constraint(
        "uq_assistant_messages_client_id",
        "assistant_messages",
        type_="unique",
    )
    op.drop_constraint(
        "ck_assistant_messages_client_id_role",
        "assistant_messages",
        type_="check",
    )
    op.drop_column("assistant_messages", "client_message_id")
