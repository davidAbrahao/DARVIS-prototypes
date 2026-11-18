import pytest
from fastapi import HTTPException
from starlette.requests import Request

from app.api import routes as api_routes
from app.core.config import Settings


@pytest.fixture(autouse=True)
def auth_settings(monkeypatch) -> None:
    monkeypatch.setattr(
        api_routes.auth,
        "get_settings",
        lambda: Settings(
            app_env="test",
            cors_origins=["https://cockpit.darvis.app"],
        ),
    )


def _request(*, csrf_cookie: str | None, origin: str | None) -> Request:
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
            "method": "POST",
            "scheme": "https",
            "path": "/api/v1/auth/refresh",
            "raw_path": b"/api/v1/auth/refresh",
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

    api_routes.auth._validate_csrf(request, "csrf-secret")


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
        api_routes.auth._validate_csrf(request, header)

    assert error.value.status_code == 403


def test_csrf_rejects_untrusted_origin() -> None:
    request = _request(
        csrf_cookie="csrf-secret",
        origin="https://attacker.example",
    )

    with pytest.raises(HTTPException) as error:
        api_routes.auth._validate_csrf(request, "csrf-secret")

    assert error.value.status_code == 403


def test_csrf_token_comparison_does_not_require_origin_header_for_non_browser_clients() -> None:
    request = _request(csrf_cookie="csrf-secret", origin=None)

    api_routes.auth._validate_csrf(request, "csrf-secret")
