from fastapi import APIRouter, Depends

from app.api.deps import get_current_user
from app.schemas.auth import ModuleStatus

router = APIRouter(prefix="/system", tags=["system"], dependencies=[Depends(get_current_user)])

# Princípio do brief (seção 12): cada funcionalidade é implementada, simulada ou planejada.
MODULES = [
    ModuleStatus(module="auth", status="implementado", phase=2),
    ModuleStatus(module="audit-log", status="implementado", phase=2),
    ModuleStatus(module="tasks", status="implementado", phase=3),
    ModuleStatus(module="projects", status="implementado", phase=3),
    ModuleStatus(
        module="notes", status="implementado", phase=3,
        detail="Armazenadas no PostgreSQL; o Vault do Obsidian vira a fonte da verdade na Fase 6.",
    ),
    ModuleStatus(module="ai-gateway (Gemini)", status="planejado", phase=4),
    ModuleStatus(module="telegram", status="planejado", phase=4),
    ModuleStatus(module="agents-and-tools", status="planejado", phase=5),
    ModuleStatus(module="obsidian-sync", status="planejado", phase=6),
]


@router.get("/status", response_model=list[ModuleStatus])
def status():
    return MODULES
