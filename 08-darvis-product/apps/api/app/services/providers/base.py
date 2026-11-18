from dataclasses import dataclass
from typing import Literal, Protocol, Sequence


ChatRole = Literal["user", "assistant"]


@dataclass(frozen=True)
class ChatTurn:
    role: ChatRole
    content: str


@dataclass(frozen=True)
class GeneratedReply:
    content: str
    provider: str
    model: str


class ChatProvider(Protocol):
    provider_name: str
    model_name: str

    def generate(self, turns: Sequence[ChatTurn]) -> GeneratedReply:
        """Gera uma resposta textual sem executar ferramentas automaticamente."""


class ProviderNotConfigured(RuntimeError):
    """O provedor de IA ainda não está habilitado no servidor."""


class ProviderGenerationError(RuntimeError):
    """O provedor não conseguiu produzir uma resposta utilizável."""
