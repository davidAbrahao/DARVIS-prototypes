import jwt
import pytest
from argon2 import extract_parameters
from pydantic import SecretStr

from app.core import security
from app.core.config import Settings


def test_password_hash_uses_argon2id_and_verifies(monkeypatch) -> None:
    monkeypatch.setattr(
        security, "get_settings",
        lambda: Settings(app_env="test", secret_key=SecretStr("s" * 48)),
    )
    encoded = security.hash_password("uma-senha-longa-e-unica")
    assert extract_parameters(encoded).type.name == "ID"
    assert security.verify_password("uma-senha-longa-e-unica", encoded)
    assert not security.verify_password("senha-incorreta", encoded)


def test_unknown_user_password_check_uses_dummy_hash() -> None:
    assert not security.verify_password("senha-qualquer", None)


def test_access_token_has_expected_issuer_audience_and_session(monkeypatch) -> None:
    monkeypatch.setattr(
        security, "get_settings",
        lambda: Settings(app_env="test", secret_key=SecretStr("s" * 48)),
    )
    token = security.create_access_token(user_id=7, session_id="sessao-1", ttl_minutes=10)
    claims = security.decode_access_token(token)
    assert claims["sub"] == "7"
    assert claims["sid"] == "sessao-1"
    assert claims["type"] == "access"


def test_access_token_rejects_wrong_signing_key(monkeypatch) -> None:
    monkeypatch.setattr(
        security, "get_settings",
        lambda: Settings(app_env="test", secret_key=SecretStr("s" * 48)),
    )
    token = security.create_access_token(user_id=7, session_id="sessao-1", ttl_minutes=10)
    monkeypatch.setattr(
        security, "get_settings",
        lambda: Settings(app_env="test", secret_key=SecretStr("x" * 48)),
    )
    with pytest.raises(jwt.InvalidTokenError):
        security.decode_access_token(token)
