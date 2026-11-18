from fastapi.routing import APIRoute, iter_route_contexts

from app.main import app


def registered_route_entries() -> list[tuple[str, set[str]]]:
    """Retorna os caminhos efetivos, inclusive os prefixos de routers incluídos."""
    return [
        (context.path, context.route.methods or set())
        for context in iter_route_contexts(app.routes)
        if isinstance(context.route, APIRoute)
    ]


def test_authentication_and_domain_routes_are_registered() -> None:
    routes = {
        (path, method)
        for path, methods in registered_route_entries()
        for method in methods
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
        ("/api/v1/assistant/context-preview", "POST"),
        ("/api/v1/assistant/status", "GET"),
        ("/api/v1/assistant/conversations", "GET"),
        ("/api/v1/assistant/conversations", "POST"),
        ("/api/v1/assistant/conversations/{conversation_id}", "PATCH"),
        ("/api/v1/assistant/conversations/{conversation_id}", "DELETE"),
        ("/api/v1/assistant/conversations/{conversation_id}/messages", "GET"),
        ("/api/v1/assistant/conversations/{conversation_id}/messages", "POST"),
    }

    assert expected <= routes


def test_api_routes_are_registered_only_once_per_method() -> None:
    registered_routes = [
        (path, method)
        for path, methods in registered_route_entries()
        for method in methods
    ]

    assert len(registered_routes) == len(set(registered_routes))
