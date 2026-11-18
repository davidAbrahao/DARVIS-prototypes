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
    } <= set(Base.metadata.tables)
    assert models.User.__tablename__ == "users"
    assert models.AuthSession.__tablename__ == "auth_sessions"
    assert models.RefreshToken.__tablename__ == "refresh_tokens"
    assert models.AuthRateLimit.__tablename__ == "auth_rate_limits"
    assert models.AuditEvent.__tablename__ == "audit_events"

    assert models.Project.__tablename__ == "projects"
    assert models.Task.__tablename__ == "tasks"
