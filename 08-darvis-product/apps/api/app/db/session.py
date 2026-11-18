from collections.abc import Generator

from fastapi import HTTPException
from sqlalchemy import Engine, create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import get_settings


def build_database_url() -> str | None:
    configured = get_settings().database_url
    if configured is None:
        return None
    url = configured.get_secret_value()
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+psycopg://", 1)
    if url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+psycopg://", 1)
    return url


def create_database_engine() -> Engine | None:
    url = build_database_url()
    if not url:
        return None
    settings = get_settings()
    options: dict[str, object] = {"pool_pre_ping": True}
    if settings.app_env == "production":
        options.update(pool_size=5, max_overflow=10, pool_recycle=1800)
    return create_engine(url, **options)


engine = create_database_engine()
SessionLocal = (
    sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False)
    if engine
    else None
)


def get_db() -> Generator[Session, None, None]:
    if SessionLocal is None:
        raise HTTPException(status_code=503, detail="Banco de dados indisponível")
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
