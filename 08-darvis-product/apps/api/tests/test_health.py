from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_liveness_reports_process_is_alive() -> None:
    response = client.get("/health/live")

    assert response.status_code == 200
    assert response.json()["status"] == "alive"


def test_api_health_does_not_claim_database_is_connected() -> None:
    response = client.get("/api/v1/health")

    assert response.status_code == 200
    assert response.json()["database"] == "not_configured"
