from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.user import User


def owned_or_404(db: Session, model, obj_id: int, user: User):
    """Devolve o objeto só se pertencer ao usuário; 404 em ambos os casos (não vaza existência)."""
    obj = db.get(model, obj_id)
    if obj is None or obj.user_id != user.id:
        raise HTTPException(404, "Não encontrado")
    return obj


def patch_data(body, nullable: set[str] = frozenset()) -> dict:
    """Campos enviados no PATCH; ignora `null` em campos que não aceitam nulo."""
    return {k: v for k, v in body.model_dump(exclude_unset=True).items() if v is not None or k in nullable}


def like_pattern(q: str) -> str:
    q = q.strip().replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
    return f"%{q}%"
