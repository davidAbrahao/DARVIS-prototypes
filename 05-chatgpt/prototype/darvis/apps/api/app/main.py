from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="D.A.R.V.I.S. API",
    version="0.1.0",
    description="Backend inicial do Personal Intelligence System.",
)

# Restrict this list to the actual frontend origins before deploying publicly.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["Content-Type", "Authorization"],
)


@app.get("/health", tags=["System"])
async def health() -> dict[str, str]:
    """Liveness endpoint. Does not imply database or AI connectivity."""
    return {"status": "ok", "service": "darvis-api", "version": "0.1.0"}


@app.get("/api/v1/status", tags=["System"])
async def system_status() -> dict:
    """Report implemented versus planned capabilities honestly."""
    return {
        "product": "D.A.R.V.I.S.",
        "stage": "prototype",
        "capabilities": {
            "api_health": "implemented",
            "authentication": "planned",
            "database": "planned",
            "persistent_memory": "planned",
            "gemini_provider": "planned",
            "telegram": "planned",
            "obsidian_sync": "planned",
            "agent_tools": "planned",
        },
    }
