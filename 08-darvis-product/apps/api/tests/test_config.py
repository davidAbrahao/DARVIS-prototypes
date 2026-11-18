import pytest
from pydantic import ValidationError

from app.core.config import Settings


def test_development_can_start_without_database_during_scaffolding() -> None:
    settings = Settings(app_env="development", database_url=None)
    assert settings.database_url is None


def test_production_requires_postgresql() -> None:
    with pytest.raises(ValidationError):
        Settings(
            app_env="production",
            database_url="sqlite:///./darvis.db",
            secret_key="x" * 48,
            cors_origins=["https://app.example.com"],
        )


def test_production_requires_strong_secret() -> None:
    with pytest.raises(ValidationError):
        Settings(
            app_env="production",
            database_url="postgresql+psycopg://user:pass@localhost/darvis",
            secret_key="short",
            cors_origins=["https://app.example.com"],
        )


def test_wildcard_cors_is_rejected() -> None:
    with pytest.raises(ValidationError):
        Settings(app_env="development", cors_origins=["*"])
