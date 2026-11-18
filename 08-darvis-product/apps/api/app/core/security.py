import hashlib
import secrets
from datetime import UTC, datetime, timedelta
from typing import Any

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerificationError, VerifyMismatchError
from argon2.low_level import Type

from app.core.config import get_settings

_password_hasher = PasswordHasher(
    time_cost=3,
    memory_cost=65536,
    parallelism=2,
    hash_len=32,
    salt_len=16,
    type=Type.ID,
)
_dummy_password_hash = _password_hasher.hash(secrets.token_urlsafe(32))
JWT_ISSUER = "darvis-api"
JWT_AUDIENCE = "darvis-web"


def signing_key() -> str:
    value = get_settings().secret_key.get_secret_value()
    if len(value.encode("utf-8")) < 32:
        raise RuntimeError("SECRET_KEY deve conter pelo menos 32 bytes para habilitar autenticação")
    return value


def hash_password(password: str) -> str:
    return _password_hasher.hash(password)


def verify_password(password: str, password_hash: str | None) -> bool:
    candidate = password_hash or _dummy_password_hash
    try:
        valid = _password_hasher.verify(candidate, password)
    except (VerifyMismatchError, VerificationError, InvalidHashError):
        return False
    return valid and password_hash is not None


def password_needs_rehash(password_hash: str) -> bool:
    try:
        return _password_hasher.check_needs_rehash(password_hash)
    except (VerificationError, InvalidHashError):
        return True


def new_refresh_token() -> str:
    return secrets.token_urlsafe(48)


def hash_refresh_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def new_csrf_token() -> str:
    return secrets.token_urlsafe(32)


def create_access_token(*, user_id: int, session_id: str, ttl_minutes: int) -> str:
    now = datetime.now(UTC)
    expires = now + timedelta(minutes=ttl_minutes)
    payload: dict[str, Any] = {
        "iss": JWT_ISSUER,
        "aud": JWT_AUDIENCE,
        "sub": str(user_id),
        "sid": session_id,
        "jti": secrets.token_urlsafe(16),
        "iat": now,
        "exp": expires,
        "type": "access",
    }
    return jwt.encode(payload, signing_key(), algorithm="HS256")


def decode_access_token(token: str) -> dict[str, Any]:
    return jwt.decode(
        token,
        signing_key(),
        algorithms=["HS256"],
        audience=JWT_AUDIENCE,
        issuer=JWT_ISSUER,
        options={"require": ["iss", "aud", "sub", "sid", "jti", "iat", "exp", "type"]},
    )
