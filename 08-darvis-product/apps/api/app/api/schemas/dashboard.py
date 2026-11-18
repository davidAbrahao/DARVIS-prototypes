from pydantic import BaseModel


class DashboardSummary(BaseModel):
    projects_total: int
    projects_active: int
    tasks_total: int
    tasks_open: int
    tasks_completed: int
    tasks_due_soon: int
