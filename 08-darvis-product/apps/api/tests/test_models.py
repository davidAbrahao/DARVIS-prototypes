from app import models
from app.db.base import Base


def test_authentication_models_are_registered_in_metadata() -> None:
    assert {
        "users",
        "auth_sessions",
        "refresh_tokens",
        "auth_rate_limits",
        "audit_events",
        "projects",
        "tasks",
        "assistant_conversations",
        "assistant_messages",
    } <= set(Base.metadata.tables)
    assert models.User.__tablename__ == "users"
    assert models.AuthSession.__tablename__ == "auth_sessions"
    assert models.RefreshToken.__tablename__ == "refresh_tokens"
    assert models.AuthRateLimit.__tablename__ == "auth_rate_limits"
    assert models.AuditEvent.__tablename__ == "audit_events"

    assert models.Project.__tablename__ == "projects"
    assert models.Task.__tablename__ == "tasks"


def test_assistant_models_are_registered_in_metadata() -> None:
    assert models.AssistantConversation.__tablename__ == "assistant_conversations"
    assert models.AssistantMessage.__tablename__ == "assistant_messages"
    conversation_constraints = {
        constraint.name
        for constraint in models.AssistantConversation.__table__.constraints
    }
    message_constraints = {
        constraint.name
        for constraint in models.AssistantMessage.__table__.constraints
    }
    assert "uq_assistant_conversations_id_user" in conversation_constraints
    assert "fk_assistant_messages_conversation_owner" in message_constraints
    assert "ck_assistant_messages_role" in message_constraints
    assert "ck_assistant_messages_client_id_role" in message_constraints
    assert "uq_assistant_messages_client_id" in message_constraints


def test_project_task_models_declare_database_level_tenant_constraints() -> None:
    project_constraints = {
        constraint.name for constraint in models.Project.__table__.constraints
    }
    task_constraints = {
        constraint.name for constraint in models.Task.__table__.constraints
    }

    assert "uq_projects_id_user" in project_constraints
    assert "ck_projects_status" in project_constraints
    assert "fk_tasks_project_owner" in task_constraints
    assert "ck_tasks_status" in task_constraints
    assert "ck_tasks_priority" in task_constraints

    assert models.AssistantConversation.__tablename__ == "assistant_conversations"
    assert models.AssistantMessage.__tablename__ == "assistant_messages"
