from app import models
from app.db.base import Base


def test_initial_models_are_registered_in_metadata() -> None:
    assert {"users", "auth_sessions", "audit_events"} <= set(Base.metadata.tables)
    assert models.User.__tablename__ == "users"
    assert models.AuthSession.__tablename__ == "auth_sessions"
    assert models.AuditEvent.__tablename__ == "audit_events"
