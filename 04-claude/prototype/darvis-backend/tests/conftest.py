import os

os.environ.setdefault("SECRET_KEY", "chave-de-teste-com-mais-de-trinta-e-dois-caracteres")
os.environ.setdefault("DATABASE_URL", "sqlite://")

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import app.models  # noqa: F401
from app.db.base import Base
from app.db.session import get_db
from app.main import app
from app.services.auth_service import create_user

EMAIL, PASSWORD = "david@example.com", "uma-senha-bem-longa-123"


@pytest.fixture()
def client():
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine, expire_on_commit=False)

    def override():
        with Session() as db:
            yield db

    app.dependency_overrides[get_db] = override
    with Session() as db:
        create_user(db, EMAIL, PASSWORD, "David")
    yield TestClient(app)
    app.dependency_overrides.clear()


def login(client, password=PASSWORD):
    return client.post("/api/v1/auth/login", data={"username": EMAIL, "password": password})


@pytest.fixture()
def tokens(client):
    return login(client).json()


def auth(tokens, key="access_token"):
    return {"Authorization": f"Bearer {tokens[key]}"}
