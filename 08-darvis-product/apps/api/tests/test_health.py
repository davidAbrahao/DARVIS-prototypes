from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_liveness_reports_process_is_alive() -> None:
    response = client.get("/health/live")

    assert response.status_code == 200
    assert response.json()["status"] == "alive"


def test_api_health_reports_database_configuration_without_claiming_readiness() -> None:
    response = client.get("/api/v1/health")

    assert response.status_code == 200
    assert response.json()["database"] == "not_configured"


def test_readiness_is_unavailable_when_database_is_not_configured() -> None:
    response = client.get("/api/v1/ready")

    assert response.status_code == 503
    assert response.json() == {
        "status": "not_ready",
        "checks": {"database": "not_configured"},
    }
