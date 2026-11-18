import pytest
from fastapi import HTTPException, Response
from starlette.requests import Request

from app.api.routes import auth as auth_routes
from app.core.config import Settings


@pytest.fixture(autouse=True)
def auth_settings(monkeypatch) -> None:
    monkeypatch.setattr(
        auth_routes,
        "get_settings",
        lambda: Settings(
            app_env="test",
            cors_origins=["https://cockpit.darvis.app"],
        ),
    )


def _request(
    *,
    csrf_cookie: str | None,
    origin: str | None,
    method: str = "POST",
    path: str = "/api/v1/auth/refresh",
) -> Request:
    headers: list[tuple[bytes, bytes]] = []
    if csrf_cookie is not None:
        headers.append((b"cookie", f"darvis_csrf={csrf_cookie}".encode("ascii")))
    if origin is not None:
        headers.append((b"origin", origin.encode("ascii")))

    return Request(
        {
            "type": "http",
            "asgi": {"version": "3.0", "spec_version": "2.3"},
            "http_version": "1.1",
            "method": method,
            "scheme": "https",
            "path": path,
            "raw_path": path.encode("ascii"),
            "query_string": b"",
            "headers": headers,
            "client": ("127.0.0.1", 54321),
            "server": ("cockpit.darvis.app", 443),
        }
    )


def test_csrf_accepts_matching_double_submit_and_allowed_origin() -> None:
    request = _request(
        csrf_cookie="csrf-secret",
        origin="https://cockpit.darvis.app",
    )

    auth_routes._validate_csrf(request, "csrf-secret")


@pytest.mark.parametrize(
    ("cookie", "header"),
    [
        (None, "csrf-secret"),
        ("csrf-secret", None),
        ("csrf-secret", "other-secret"),
    ],
)
def test_csrf_rejects_missing_or_mismatched_tokens(
    cookie: str | None,
    header: str | None,
) -> None:
    request = _request(csrf_cookie=cookie, origin="https://cockpit.darvis.app")

    with pytest.raises(HTTPException) as error:
        auth_routes._validate_csrf(request, header)

    assert error.value.status_code == 403


def test_csrf_rejects_untrusted_origin() -> None:
    request = _request(
        csrf_cookie="csrf-secret",
        origin="https://attacker.example",
    )

    with pytest.raises(HTTPException) as error:
        auth_routes._validate_csrf(request, "csrf-secret")

    assert error.value.status_code == 403


def test_csrf_token_comparison_does_not_require_origin_header_for_non_browser_clients() -> None:
    request = _request(csrf_cookie="csrf-secret", origin=None)

    auth_routes._validate_csrf(request, "csrf-secret")


def test_csrf_bootstrap_issues_a_readable_cookie_without_refreshing_a_session() -> None:
    request = _request(
        csrf_cookie=None,
        origin="https://cockpit.darvis.app",
        method="GET",
        path="/api/v1/auth/csrf",
    )
    response = Response()

    result = auth_routes.csrf_bootstrap(request, response)
    set_cookie = response.headers["set-cookie"]

    assert len(result.csrf_token) >= 32
    assert "darvis_csrf=" in set_cookie
    assert "HttpOnly" not in set_cookie
    assert "Path=/api/v1/auth" in set_cookie
    assert response.headers["cache-control"] == "no-store"


def test_csrf_bootstrap_returns_existing_cookie_without_rotating_it() -> None:
    request = _request(
        csrf_cookie="existing-csrf-token",
        origin="https://cockpit.darvis.app",
        method="GET",
        path="/api/v1/auth/csrf",
    )
    response = Response()

    result = auth_routes.csrf_bootstrap(request, response)

    assert result.csrf_token == "existing-csrf-token"
    assert "set-cookie" not in response.headers


def test_csrf_bootstrap_rejects_untrusted_origin() -> None:
    request = _request(
        csrf_cookie=None,
        origin="https://attacker.example",
        method="GET",
        path="/api/v1/auth/csrf",
    )

    with pytest.raises(HTTPException) as error:
        auth_routes.csrf_bootstrap(request, Response())

    assert error.value.status_code == 403


def test_origin_validation_accepts_configured_origin_and_missing_origin() -> None:
    allowed_request = _request(
        csrf_cookie=None,
        origin="https://cockpit.darvis.app",
    )
    non_browser_request = _request(csrf_cookie=None, origin=None)

    auth_routes._validate_origin(allowed_request)
    auth_routes._validate_origin(non_browser_request)


def test_origin_validation_rejects_unconfigured_origin() -> None:
    request = _request(
        csrf_cookie=None,
        origin="https://attacker.example",
    )

    with pytest.raises(HTTPException) as error:
        auth_routes._validate_origin(request)

    assert error.value.status_code == 403
