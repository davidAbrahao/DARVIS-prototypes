from fastapi import APIRouter

from app.api.v1 import auth, dashboard, notes, projects, system, tasks

api_router = APIRouter()
for r in (auth, system, dashboard, notes, tasks, projects):
    api_router.include_router(r.router)
