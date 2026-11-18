from unittest.mock import MagicMock

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_liveness_reports_process_is_alive() -> None:
    response = client.get("/health/live")

    assert response.status_code == 200
    assert response.json()["status"] == "alive"


def test_api_health_reports_database_configuration() -> None:
    response = client.get("/api/v1/health")

    assert response.status_code == 200
    assert response.json()["database"] in {"configured", "not_configured"}


def test_readiness_is_unavailable_when_database_is_not_configured(monkeypatch) -> None:
    monkeypatch.setattr("app.main.engine", None)

    response = client.get("/api/v1/ready")

    assert response.status_code == 503
    assert response.json() == {
        "status": "not_ready",
        "checks": {"database": "not_configured"},
    }


def test_readiness_confirms_database_query(monkeypatch) -> None:
    connection = MagicMock()
    fake_engine = MagicMock()
    fake_engine.connect.return_value.__enter__.return_value = connection
    monkeypatch.setattr("app.main.engine", fake_engine)

    response = client.get("/api/v1/ready")

    assert response.status_code == 200
    assert response.json() == {
        "status": "ready",
        "checks": {"database": "available"},
    }
    connection.execute.assert_called_once()
