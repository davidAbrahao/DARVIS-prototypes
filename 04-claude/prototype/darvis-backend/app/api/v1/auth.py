from fastapi import APIRouter, Depends, Request, Response, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, user_from_token
from app.core.security import hash_password, verify_password
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import PasswordChange, RefreshRequest, TokenPair, UserOut
from app.services.audit import record
from app.services.auth_service import authenticate, issue_tokens

router = APIRouter(prefix="/auth", tags=["auth"])


def _ip(request: Request) -> str | None:
    return request.client.host if request.client else None


@router.post("/login", response_model=TokenPair)
def login(request: Request, form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Login com e-mail no campo `username` (compatível com o botão Authorize do /docs)."""
    user = authenticate(db, form.username, form.password, _ip(request))
    return issue_tokens(user)


@router.post("/refresh", response_model=TokenPair)
def refresh(body: RefreshRequest, db: Session = Depends(get_db)):
    user = user_from_token(db, body.refresh_token, "refresh")
    return issue_tokens(user)


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return user


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(request: Request, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Logout global: invalida todos os tokens emitidos para este usuário."""
    user.token_version += 1
    record(db, "logout", user_id=user.id, ip=_ip(request))
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/change-password", status_code=status.HTTP_204_NO_CONTENT)
def change_password(body: PasswordChange, request: Request, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not verify_password(body.current_password, user.password_hash):
        record(db, "password_change_failed", user_id=user.id, ip=_ip(request))
        db.commit()
        from fastapi import HTTPException

        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Senha atual incorreta")
    user.password_hash = hash_password(body.new_password)
    user.token_version += 1  # força novo login em todos os dispositivos
    record(db, "password_changed", user_id=user.id, ip=_ip(request))
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
