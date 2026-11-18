"""Cria o usuário único do D.A.R.V.I.S. Uso: python -m scripts.create_user --email voce@exemplo.com"""
import argparse
import getpass
import sys

from sqlalchemy import select

from app.db.session import SessionLocal
from app.models.user import User
from app.services.auth_service import create_user


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--email", required=True)
    p.add_argument("--name", default="")
    a = p.parse_args()
    pw = getpass.getpass("Senha (mín. 12 caracteres): ")
    if len(pw) < 12 or pw != getpass.getpass("Repita a senha: "):
        sys.exit("Senha curta demais ou diferente da confirmação.")
    with SessionLocal() as db:
        if db.scalar(select(User).where(User.email == a.email.lower())):
            sys.exit("Já existe um usuário com esse e-mail.")
        create_user(db, a.email, pw, a.name)
    print("Usuário criado.")


if __name__ == "__main__":
    main()
