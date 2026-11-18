from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings

settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    docs_url="/docs" if settings.app_env != "production" else None,
    redoc_url=None,
)

if settings.app_env != "production":
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
        allow_headers=["Authorization", "Content-Type", "X-Request-ID"],
    )


@app.get("/health/live", tags=["health"])
async def liveness() -> dict[str, str]:
    """Confirms that the API process is running; does not imply dependencies are ready."""
    return {"status": "alive", "service": "darvis-api"}


@app.get(f"{settings.api_v1_prefix}/health", tags=["health"])
async def health() -> dict[str, str]:
    """Basic application identity endpoint. Dependency readiness is added with the DB layer."""
    return {
        "status": "ok",
        "service": "darvis-api",
        "environment": settings.app_env,
        "database": "not_configured",
    }
