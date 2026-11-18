"""Impõe integridade referencial entre tarefa, projeto e proprietário."""

from alembic import op

revision = "0004_project_owner_fk"
down_revision = "0003_projects_tasks"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_check_constraint(
        "ck_projects_status",
        "projects",
        "status IN ('active', 'on_hold', 'completed', 'archived')",
    )
    op.create_check_constraint(
        "ck_tasks_status",
        "tasks",
        "status IN ('todo', 'in_progress', 'blocked', 'done', 'cancelled')",
    )
    op.create_check_constraint(
        "ck_tasks_priority",
        "tasks",
        "priority IN ('low', 'normal', 'high', 'urgent')",
    )
    op.create_unique_constraint(
        "uq_projects_id_user",
        "projects",
        ["id", "user_id"],
    )
    op.drop_constraint(
        "tasks_project_id_fkey",
        "tasks",
        type_="foreignkey",
    )
    op.create_foreign_key(
        "fk_tasks_project_owner",
        "tasks",
        "projects",
        ["project_id", "user_id"],
        ["id", "user_id"],
        ondelete="RESTRICT",
    )


def downgrade() -> None:
    op.drop_constraint("ck_tasks_priority", "tasks", type_="check")
    op.drop_constraint("ck_tasks_status", "tasks", type_="check")
    op.drop_constraint("ck_projects_status", "projects", type_="check")
    op.drop_constraint(
        "fk_tasks_project_owner",
        "tasks",
        type_="foreignkey",
    )
    op.create_foreign_key(
        "tasks_project_id_fkey",
        "tasks",
        "projects",
        ["project_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.drop_constraint(
        "uq_projects_id_user",
        "projects",
        type_="unique",
    )
