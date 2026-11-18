from types import SimpleNamespace

import pytest
from google import genai

from app.core.config import Settings
from app.services import assistant as assistant_service
from app.services.providers import (
    ChatTurn,
    ProviderNotConfigured,
)
from app.services.providers import gemini as gemini_module
from app.services.providers import registry as provider_registry


def test_provider_registry_is_disabled_by_default(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(
        provider_registry,
        "get_settings",
        lambda: Settings(ai_provider="disabled"),
    )

    with pytest.raises(ProviderNotConfigured):
        provider_registry.get_chat_provider()


def test_provider_registry_requires_gemini_credential(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(
        provider_registry,
        "get_settings",
        lambda: Settings(ai_provider="gemini", gemini_api_key=""),
    )

    with pytest.raises(ProviderNotConfigured):
        provider_registry.get_chat_provider()


def test_assistant_status_does_not_expose_provider_secret(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(
        assistant_service,
        "get_settings",
        lambda: Settings(
            ai_provider="gemini",
            gemini_api_key="credential-that-must-not-leak",
            gemini_model="gemini-3.8-flash",
        ),
    )

    result = assistant_service.assistant_status()

    assert result == {
        "state": "configured",
        "provider": "gemini",
        "model": "gemini-3.8-flash",
        "configured": True,
    }
    assert "credential-that-must-not-leak" not in str(result)


def test_gemini_adapter_generates_text_without_registering_tools(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    captured: dict[str, object] = {}

    class FakeModels:
        def generate_content(self, **kwargs):
            captured.update(kwargs)
            return SimpleNamespace(text="Resposta de teste do D.A.R.V.I.S.")

    class FakeClient:
        def __init__(self, *, api_key: str):
            captured["api_key"] = api_key
            self.models = FakeModels()

        def __enter__(self):
            return self

        def __exit__(self, exc_type, exc, traceback):
            return False

    monkeypatch.setattr(genai, "Client", FakeClient)
    provider = gemini_module.GeminiProvider(
        api_key="credential-for-unit-test",
        model_name="gemini-3.8-flash",
        max_output_tokens=1024,
    )

    result = provider.generate(
        [
            ChatTurn(role="user", content="Olá"),
            ChatTurn(role="assistant", content="Olá!"),
            ChatTurn(role="user", content="Como você pode me ajudar?"),
        ]
    )

    assert result.content == "Resposta de teste do D.A.R.V.I.S."
    assert result.provider == "gemini"
    assert result.model == "gemini-3.8-flash"
    assert captured["api_key"] == "credential-for-unit-test"
    assert captured["model"] == "gemini-3.8-flash"
    assert captured["config"].tools is None
