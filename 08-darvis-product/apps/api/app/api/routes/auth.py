import hmac
from typing import Annotated

from fastapi import APIRouter, Depends, Header, HTTPException, Request, Response, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.api.schemas.auth import (
    AuthResponse,
    CsrfResponse,
    LoginRequest,
    OwnerSetupRequest,
    UserResponse,
)
from app.core.config import get_settings
from app.core.security import new_csrf_token
from app.db.session import get_db
from app.models.user import User
from app.services.auth import (
    AuthResult,
    login,
    logout_all,
    logout_session,
    refresh_session,
    setup_owner,
)

router = APIRouter(prefix="/auth", tags=["autenticação"])
REFRESH_COOKIE = "darvis_refresh"
CSRF_COOKIE = "darvis_csrf"


def _cookie_path() -> str:
    return f"{get_settings().api_v1_prefix}/auth"


def _client_ip(request: Request) -> str:
    # Não confiar em X-Forwarded-For sem uma lista explícita de proxies confiáveis.
    return request.client.host if request.client else "unknown"


def _set_session_cookies(response: Response, result: AuthResult) -> None:
    settings = get_settings()
    secure = settings.app_env in {"staging", "production"}
    cookie_path = _cookie_path()
    max_age = settings.refresh_token_ttl_days * 24 * 60 * 60
    response.set_cookie(
        REFRESH_COOKIE,
        result.refresh_token,
        max_age=max_age,
        httponly=True,
        secure=secure,
        samesite="lax",
        path=cookie_path,
    )
    response.set_cookie(
        CSRF_COOKIE,
        result.csrf_token,
        max_age=max_age,
        httponly=False,
        secure=secure,
        samesite="lax",
        path=cookie_path,
    )


def _clear_session_cookies(response: Response) -> None:
    settings = get_settings()
    secure = settings.app_env in {"staging", "production"}
    cookie_path = _cookie_path()
    response.delete_cookie(
        REFRESH_COOKIE,
        path=cookie_path,
        secure=secure,
        httponly=True,
        samesite="lax",
    )
    response.delete_cookie(
        CSRF_COOKIE,
        path=cookie_path,
        secure=secure,
        httponly=False,
        samesite="lax",
    )


def _validate_csrf(request: Request, csrf_header: str | None) -> None:
    cookie_value = request.cookies.get(CSRF_COOKIE)
    if not cookie_value or not csrf_header or not hmac.compare_digest(cookie_value, csrf_header):
        raise HTTPException(status_code=403, detail="Validação de segurança da sessão falhou")

    origin = request.headers.get("origin")
    if origin:
        allowed = {item.rstrip("/") for item in get_settings().cors_origins}
        if origin.rstrip("/") not in allowed:
            raise HTTPException(status_code=403, detail="Origem não autorizada")


def _response_payload(result: AuthResult) -> AuthResponse:
    return AuthResponse(
        access_token=result.access_token,
        expires_in=result.expires_in,
        csrf_token=result.csrf_token,
        user=UserResponse(
            id=result.user.id, email=result.user.email, full_name=result.user.full_name
        ),
    )


@router.get("/csrf", response_model=CsrfResponse)
def csrf_bootstrap(request: Request, response: Response) -> CsrfResponse:
    """Entrega à origem permitida o token necessário para renovar a sessão após recarregar."""
    origin = request.headers.get("origin")
    if origin:
        allowed = {item.rstrip("/") for item in get_settings().cors_origins}
        if origin.rstrip("/") not in allowed:
            raise HTTPException(status_code=403, detail="Origem não autorizada")

    csrf_token = request.cookies.get(CSRF_COOKIE)
    if not csrf_token:
        settings = get_settings()
        csrf_token = new_csrf_token()
        response.set_cookie(
            CSRF_COOKIE,
            csrf_token,
            max_age=settings.refresh_token_ttl_days * 24 * 60 * 60,
            httponly=False,
            secure=settings.app_env in {"staging", "production"},
            samesite="lax",
            path=_cookie_path(),
        )

    response.headers["Cache-Control"] = "no-store"
    return CsrfResponse(csrf_token=csrf_token)


@router.post("/setup", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def configure_owner(
    payload: OwnerSetupRequest,
    request: Request,
    response: Response,
    db: Annotated[Session, Depends(get_db)],
    setup_token: Annotated[str | None, Header(alias="X-Setup-Token")] = None,
) -> AuthResponse:
    result = setup_owner(
        db,
        email=str(payload.email),
        full_name=payload.full_name,
        password=payload.password,
        setup_token=setup_token,
        ip_address=_client_ip(request),
    )
    _set_session_cookies(response, result)
    return _response_payload(result)


@router.post("/login", response_model=AuthResponse)
def authenticate(
    payload: LoginRequest,
    request: Request,
    response: Response,
    db: Annotated[Session, Depends(get_db)],
) -> AuthResponse:
    result = login(
        db, email=str(payload.email), password=payload.password, ip_address=_client_ip(request)
    )
    _set_session_cookies(response, result)
    return _response_payload(result)


@router.post("/refresh", response_model=AuthResponse)
def renew_session(
    request: Request,
    response: Response,
    db: Annotated[Session, Depends(get_db)],
    csrf_token: Annotated[str | None, Header(alias="X-CSRF-Token")] = None,
) -> AuthResponse:
    _validate_csrf(request, csrf_token)
    raw_token = request.cookies.get(REFRESH_COOKIE)
    if not raw_token:
        raise HTTPException(status_code=401, detail="Sessão inválida ou expirada")
    result = refresh_session(db, raw_token=raw_token, ip_address=_client_ip(request))
    _set_session_cookies(response, result)
    return _response_payload(result)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def end_session(
    request: Request,
    response: Response,
    db: Annotated[Session, Depends(get_db)],
    csrf_token: Annotated[str | None, Header(alias="X-CSRF-Token")] = None,
) -> Response:
    _validate_csrf(request, csrf_token)
    logout_session(
        db, raw_token=request.cookies.get(REFRESH_COOKIE), ip_address=_client_ip(request)
    )
    _clear_session_cookies(response)
    response.status_code = status.HTTP_204_NO_CONTENT
    return response


@router.post("/logout-all", status_code=status.HTTP_204_NO_CONTENT)
def end_all_sessions(
    request: Request,
    response: Response,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> Response:
    logout_all(db, user=current_user, ip_address=_client_ip(request))
    _clear_session_cookies(response)
    response.status_code = status.HTTP_204_NO_CONTENT
    return response


@router.get("/me", response_model=UserResponse)
def current_identity(
    current_user: Annotated[User, Depends(get_current_user)],
) -> UserResponse:
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
    )
