import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.security import decode_token
from app.db.session import get_db
from app.models.user import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


def user_from_token(db: Session, token: str, kind: str) -> User:
    err = HTTPException(status.HTTP_401_UNAUTHORIZED, "Token inválido ou expirado", headers={"WWW-Authenticate": "Bearer"})
    try:
        payload = decode_token(token, kind)
        user = db.get(User, int(payload["sub"]))
    except (jwt.PyJWTError, ValueError):
        raise err
    if user is None or not user.is_active or payload.get("tv") != user.token_version:
        raise err
    return user


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    return user_from_token(db, token, "access")
