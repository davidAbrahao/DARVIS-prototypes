from functools import lru_cache
from typing import Literal

from pydantic import SecretStr, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    app_name: str = "D.A.R.V.I.S. API"
    app_env: Literal["development", "test", "staging", "production"] = "development"
    api_v1_prefix: str = "/api/v1"
    cors_origins: list[str] = ["http://localhost:3000"]
    database_url: SecretStr | None = None
    secret_key: SecretStr = SecretStr("")

    @field_validator("database_url", mode="before")
    @classmethod
    def empty_database_url_is_unconfigured(cls, value):
        return None if value == "" else value

    @field_validator("api_v1_prefix")
    @classmethod
    def validate_api_prefix(cls, value: str) -> str:
        if not value.startswith("/") or value == "/":
            raise ValueError("API_V1_PREFIX deve começar com / e não pode ser apenas /")
        return value.rstrip("/")

    @field_validator("cors_origins")
    @classmethod
    def validate_cors_origins(cls, value: list[str]) -> list[str]:
        normalized = [origin.rstrip("/") for origin in value]
        if "*" in normalized:
            raise ValueError("CORS não permite origem curinga")
        return normalized

    @model_validator(mode="after")
    def validate_production_settings(self) -> "Settings":
        if self.app_env == "production":
            if self.database_url is None:
                raise ValueError("DATABASE_URL é obrigatório em produção")
            url = self.database_url.get_secret_value()
            if not url.startswith(("postgresql://", "postgresql+psycopg://")):
                raise ValueError("Produção exige PostgreSQL com o driver psycopg")
            if len(self.secret_key.get_secret_value().encode("utf-8")) < 32:
                raise ValueError("SECRET_KEY deve ter pelo menos 32 bytes em produção")
            if not self.cors_origins:
                raise ValueError("CORS_ORIGINS deve declarar as origens permitidas em produção")
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()
