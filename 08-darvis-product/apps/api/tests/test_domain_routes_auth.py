import pytest
from fastapi.testclient import TestClient

from app.api.deps import get_db
from app.main import app


@pytest.fixture
def unauthenticated_client():
    app.dependency_overrides[get_db] = lambda: None
    with TestClient(app) as client:
        yield client
    app.dependency_overrides.pop(get_db, None)


@pytest.mark.parametrize(
    "path",
    [
        "/api/v1/projects",
        "/api/v1/tasks",
        "/api/v1/dashboard/summary",
    ],
)
def test_domain_read_endpoints_reject_requests_without_bearer_token(
    unauthenticated_client: TestClient,
    path: str,
) -> None:
    response = unauthenticated_client.get(path)

    assert response.status_code == 401
    assert response.headers.get("www-authenticate") == "Bearer"


def test_domain_mutation_endpoints_reject_requests_without_bearer_token(
    unauthenticated_client: TestClient,
) -> None:
    project_response = unauthenticated_client.post(
        "/api/v1/projects",
        json={"name": "Não deve ser criado"},
    )
    task_response = unauthenticated_client.post(
        "/api/v1/tasks",
        json={"title": "Não deve ser criada"},
    )

    assert project_response.status_code == 401
    assert task_response.status_code == 401
