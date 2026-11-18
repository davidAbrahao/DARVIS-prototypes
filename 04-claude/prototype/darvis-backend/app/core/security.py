from datetime import datetime, timedelta, timezone

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerificationError

from app.core.config import get_settings

_ph = PasswordHasher()
ALGORITHM = "HS256"


def hash_password(password: str) -> str:
    return _ph.hash(password)


def verify_password(password: str, hashed: str) -> bool:
    try:
        return _ph.verify(hashed, password)
    except (VerificationError, InvalidHashError):
        return False


def create_token(user_id: int, kind: str, token_version: int) -> tuple[str, int]:
    """Retorna (token, expira_em_segundos). kind: 'access' ou 'refresh'."""
    s = get_settings()
    delta = (
        timedelta(minutes=s.access_token_minutes)
        if kind == "access"
        else timedelta(days=s.refresh_token_days)
    )
    now = datetime.now(timezone.utc)
    payload = {"sub": str(user_id), "type": kind, "tv": token_version, "iat": now, "exp": now + delta}
    return jwt.encode(payload, s.secret_key, algorithm=ALGORITHM), int(delta.total_seconds())


def decode_token(token: str, expected_kind: str) -> dict:
    """Levanta jwt.PyJWTError se inválido, expirado ou de tipo errado."""
    payload = jwt.decode(
        token, get_settings().secret_key, algorithms=[ALGORITHM], options={"require": ["exp", "sub", "type"]}
    )
    if payload.get("type") != expected_kind:
        raise jwt.InvalidTokenError("tipo de token inválido")
    return payload
