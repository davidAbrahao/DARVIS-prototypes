from fastapi.routing import APIRoute

from app.main import app


def test_authentication_and_domain_routes_are_registered() -> None:
    routes = {
        (route.path, method)
        for route in app.routes
        if isinstance(route, APIRoute)
        for method in route.methods or set()
    }

    expected = {
        ("/api/v1/auth/csrf", "GET"),
        ("/api/v1/auth/login", "POST"),
        ("/api/v1/auth/refresh", "POST"),
        ("/api/v1/auth/me", "GET"),
        ("/api/v1/projects", "GET"),
        ("/api/v1/projects", "POST"),
        ("/api/v1/projects/{project_id}", "GET"),
        ("/api/v1/projects/{project_id}", "PATCH"),
        ("/api/v1/projects/{project_id}", "DELETE"),
        ("/api/v1/tasks", "GET"),
        ("/api/v1/tasks", "POST"),
        ("/api/v1/tasks/{task_id}", "GET"),
        ("/api/v1/tasks/{task_id}", "PATCH"),
        ("/api/v1/tasks/{task_id}", "DELETE"),
        ("/api/v1/dashboard/summary", "GET"),
        ("/api/v1/memories", "GET"),
        ("/api/v1/memories", "POST"),
        ("/api/v1/memories/{memory_id}", "GET"),
        ("/api/v1/memories/{memory_id}", "PATCH"),
        ("/api/v1/memories/{memory_id}", "DELETE"),
        ("/api/v1/assistant/status", "GET"),
        ("/api/v1/assistant/conversations", "GET"),
        ("/api/v1/assistant/conversations", "POST"),
        ("/api/v1/assistant/conversations/{conversation_id}", "PATCH"),
        ("/api/v1/assistant/conversations/{conversation_id}", "DELETE"),
        ("/api/v1/assistant/conversations/{conversation_id}/messages", "GET"),
        ("/api/v1/assistant/conversations/{conversation_id}/messages", "POST"),
    }

    assert expected <= routes
