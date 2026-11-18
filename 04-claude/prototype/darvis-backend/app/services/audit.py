from sqlalchemy.orm import Session

from app.models.audit import AuditLog


def record(db: Session, action: str, user_id: int | None = None, ip: str | None = None, detail: str | None = None) -> None:
    """Adiciona ao log de auditoria. O chamador faz o commit."""
    db.add(AuditLog(action=action, user_id=user_id, ip=ip, detail=detail))
