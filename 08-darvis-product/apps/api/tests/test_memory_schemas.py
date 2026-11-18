import pytest
from pydantic import ValidationError

from app.api.schemas.memory import MemoryCreate, MemoryUpdate


def test_memory_create_normalizes_deduplicates_and_limits_tags() -> None:
    memory = MemoryCreate(
        title="Preferência de leitura",
        content="Prefiro textos objetivos.",
        category="preference",
        tags=["Leitura", "objetivos", " leitura "],
    )

    assert memory.tags == ["leitura", "objetivos"]
    with pytest.raises(ValidationError):
        MemoryCreate(title="Memória", content="Conteúdo", category="unknown")


def test_memory_schema_rejects_empty_text_and_too_many_tags() -> None:
    with pytest.raises(ValidationError):
        MemoryCreate(title="   ", content="Conteúdo")
    with pytest.raises(ValidationError):
        MemoryCreate(title="Título", content="   ")
    with pytest.raises(ValidationError):
        MemoryCreate(
            title="Título",
            content="Conteúdo",
            tags=[f"tag-{index}" for index in range(13)],
        )


def test_memory_update_supports_archive_unarchive_and_pin() -> None:
    payload = MemoryUpdate(is_archived=True, is_pinned=True)
    assert payload.model_dump(exclude_unset=True) == {
        "is_archived": True,
        "is_pinned": True,
    }

    with pytest.raises(ValidationError):
        MemoryUpdate(category="secret")
