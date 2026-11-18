from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.core.config import get_settings
from app.db.session import engine

settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    version="0.2.0",
    docs_url="/docs" if settings.app_env != "production" else None,
    redoc_url=None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Request-ID", "X-CSRF-Token"],
)


@app.get("/health/live", tags=["saúde"])
async def liveness() -> dict[str, str]:
    """Confirma que o processo da API está em execução, sem consultar dependências."""
    return {"status": "alive", "service": "darvis-api"}


@app.get(f"{settings.api_v1_prefix}/health", tags=["saúde"])
async def health() -> dict[str, str]:
    """Identidade e configuração do serviço; não representa prontidão."""
    return {
        "status": "ok",
        "service": "darvis-api",
        "environment": settings.app_env,
        "database": "configured" if engine is not None else "not_configured",
    }


@app.get(f"{settings.api_v1_prefix}/ready", tags=["saúde"])
def readiness():
    """Verifica a disponibilidade real do banco sem expor detalhes da conexão."""
    if engine is None:
        return JSONResponse(
            status_code=503,
            content={"status": "not_ready", "checks": {"database": "not_configured"}},
        )
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
    except SQLAlchemyError:
        return JSONResponse(
            status_code=503,
            content={"status": "not_ready", "checks": {"database": "unavailable"}},
        )
    return {"status": "ready", "checks": {"database": "available"}}
