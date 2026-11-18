from tests.conftest import EMAIL, auth, login


def test_health_is_public(client):
    assert client.get("/health").json() == {"status": "ok"}


def test_login_ok_and_me(client, tokens):
    r = client.get("/api/v1/auth/me", headers=auth(tokens))
    assert r.status_code == 200 and r.json()["email"] == EMAIL


def test_wrong_password_and_unknown_user_look_the_same(client):
    a = login(client, "senha-errada-123456")
    b = client.post("/api/v1/auth/login", data={"username": "ninguem@example.com", "password": "x" * 12})
    assert a.status_code == b.status_code == 401 and a.json() == b.json()


def test_protected_routes_need_token(client):
    assert client.get("/api/v1/auth/me").status_code == 401
    assert client.get("/api/v1/system/status").status_code == 401


def test_refresh_token_is_not_an_access_token(client, tokens):
    assert client.get("/api/v1/auth/me", headers=auth(tokens, "refresh_token")).status_code == 401


def test_refresh_flow(client, tokens):
    r = client.post("/api/v1/auth/refresh", json={"refresh_token": tokens["refresh_token"]})
    assert r.status_code == 200
    assert client.post("/api/v1/auth/refresh", json={"refresh_token": tokens["access_token"]}).status_code == 401


def test_lockout_after_repeated_failures(client):
    for _ in range(5):
        assert login(client, "errada-errada-123").status_code == 401
    assert login(client).status_code == 429  # mesmo com a senha certa


def test_logout_revokes_all_tokens(client, tokens):
    assert client.post("/api/v1/auth/logout", headers=auth(tokens)).status_code == 204
    assert client.get("/api/v1/auth/me", headers=auth(tokens)).status_code == 401
    assert client.post("/api/v1/auth/refresh", json={"refresh_token": tokens["refresh_token"]}).status_code == 401


def test_change_password(client, tokens):
    new = "outra-senha-bem-longa-456"
    r = client.post("/api/v1/auth/change-password", headers=auth(tokens), json={"current_password": "errada", "new_password": new})
    assert r.status_code == 400
    r = client.post("/api/v1/auth/change-password", headers=auth(tokens), json={"current_password": "uma-senha-bem-longa-123", "new_password": new})
    assert r.status_code == 204
    assert client.get("/api/v1/auth/me", headers=auth(tokens)).status_code == 401
    assert login(client, new).status_code == 200


def test_system_status(client, tokens):
    r = client.get("/api/v1/system/status", headers=auth(tokens))
    assert r.status_code == 200 and {m["status"] for m in r.json()} == {"implementado", "planejado"}
