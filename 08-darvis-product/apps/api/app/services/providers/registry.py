from app.core.config import get_settings
from app.services.providers.base import ChatProvider, ProviderNotConfigured
from app.services.providers.gemini import GeminiProvider


def get_chat_provider() -> ChatProvider:
    settings = get_settings()
    if settings.ai_provider == "disabled":
        raise ProviderNotConfigured("O provedor de IA está desativado.")

    if settings.ai_provider == "gemini":
        api_key = settings.gemini_api_key.get_secret_value()
        if not api_key.strip():
            raise ProviderNotConfigured("A credencial do Gemini não foi configurada.")
        return GeminiProvider(
            api_key=api_key,
            model_name=settings.gemini_model,
            max_output_tokens=settings.gemini_max_output_tokens,
        )

    raise ProviderNotConfigured("Nenhum provedor de IA está disponível.")
