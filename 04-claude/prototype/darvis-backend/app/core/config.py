from functools import lru_cache

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "D.A.R.V.I.S."
    environment: str = "development"
    database_url: str = "sqlite:///./darvis.db"
    secret_key: str  # obrigatório: sem valor padrão de propósito
    access_token_minutes: int = 15
    refresh_token_days: int = 7
    max_failed_logins: int = 5
    lockout_minutes: int = 15
    cors_origins: list[str] = ["http://localhost:3000"]

    @property
    def is_production(self) -> bool:
        return self.environment == "production"

    @model_validator(mode="after")
    def _check_secret(self):
        if self.is_production and len(self.secret_key) < 32:
            raise ValueError("SECRET_KEY deve ter ao menos 32 caracteres em produção")
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()
