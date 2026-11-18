import pytest
from pydantic import ValidationError

from app.api.schemas.auth import LoginRequest, OwnerSetupRequest


def test_owner_setup_requires_a_long_password_and_nonempty_name() -> None:
    with pytest.raises(ValidationError):
        OwnerSetupRequest(email="owner@example.com", full_name=" ", password="curta")
    with pytest.raises(ValidationError):
        OwnerSetupRequest(email="owner@example.com", full_name="Owner", password="curta")


def test_auth_requests_reject_unexpected_fields() -> None:
    with pytest.raises(ValidationError):
        LoginRequest(email="owner@example.com", password="senha-longa", admin=True)


def test_email_is_accepted_and_name_is_trimmed() -> None:
    payload = OwnerSetupRequest(
        email="owner@example.com", full_name="  Proprietário  ",
        password="senha-segura-comprida",
    )
    assert payload.full_name == "Proprietário"
