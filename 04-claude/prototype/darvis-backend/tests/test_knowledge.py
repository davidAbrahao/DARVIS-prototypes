import pytest

from app.db.session import get_db
from app.main import app
from app.services.auth_service import create_user
from tests.conftest import auth

API = "/api/v1"


@pytest.fixture()
def H(tokens):
    return auth(tokens)


@pytest.fixture()
def other(client):
    db = next(app.dependency_overrides[get_db]())
    create_user(db, "outra@example.com", "outra-senha-longa-789")
    r = client.post(f"{API}/auth/login", data={"username": "outra@example.com", "password": "outra-senha-longa-789"})
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


def mk_note(client, H, **kw):
    body = {"title": "Nota", "body": "", **kw}
    r = client.post(f"{API}/notes", json=body, headers=H)
    assert r.status_code == 201, r.text
    return r.json()


def test_requires_auth(client):
    for path in ("notes", "tasks", "projects", "dashboard"):
        assert client.get(f"{API}/{path}").status_code == 401


# ---------- notas
def test_note_crud_and_tag_normalization(client, H):
    n = mk_note(client, H, title="IA não é memória", category="decisao", tags=["  IA ", "#ia", "Arquitetura"])
    assert n["tags"] == ["arquitetura", "ia"] and n["source"] == "manual"
    r = client.patch(f"{API}/notes/{n['id']}", json={"tags": ["ia", "voz"], "pinned": True, "title": None}, headers=H)
    assert r.json()["tags"] == ["ia", "voz"] and r.json()["pinned"] and r.json()["title"] == "IA não é memória"
    assert client.delete(f"{API}/notes/{n['id']}", headers=H).status_code == 204
    assert client.get(f"{API}/notes/{n['id']}", headers=H).status_code == 404


def test_note_search_filters_and_pin_order(client, H):
    mk_note(client, H, title="Supabase", body="banco de dados", category="decisao", tags=["banco"])
    mk_note(client, H, title="Voz", body="100% futuro", category="ideia")
    mk_note(client, H, title="Fixada", pinned=True, category="pessoal")
    assert [n["title"] for n in client.get(f"{API}/notes", headers=H).json()][0] == "Fixada"
    assert len(client.get(f"{API}/notes", params={"q": "BANCO"}, headers=H).json()) == 1
    assert len(client.get(f"{API}/notes", params={"q": "100%"}, headers=H).json()) == 1  # % é literal
    assert len(client.get(f"{API}/notes", params={"q": "%"}, headers=H).json()) == 1
    assert len(client.get(f"{API}/notes", params={"category": "ideia"}, headers=H).json()) == 1
    assert len(client.get(f"{API}/notes", params={"tag": "#banco"}, headers=H).json()) == 1
    assert client.get(f"{API}/notes", params={"category": "xyz"}, headers=H).status_code == 422


def test_related_notes_ranked_by_shared_tags(client, H):
    a = mk_note(client, H, title="A", tags=["x", "y"])
    b = mk_note(client, H, title="B", tags=["x"])
    c = mk_note(client, H, title="C", tags=["x", "y"])
    mk_note(client, H, title="D", tags=["z"])
    rel = client.get(f"{API}/notes/{a['id']}/related", headers=H).json()
    assert [n["title"] for n in rel] == ["C", "B"]


def test_content_hash_changes_with_body(client, H):
    n = mk_note(client, H, title="Hash", body="um")
    db = next(app.dependency_overrides[get_db]())
    from app.models.knowledge import Note

    h1 = db.get(Note, n["id"]).content_hash
    client.patch(f"{API}/notes/{n['id']}", json={"body": "dois"}, headers=H)
    db.expire_all()
    assert db.get(Note, n["id"]).content_hash != h1


def test_ownership_isolation(client, H, other):
    n = mk_note(client, H)
    t = client.post(f"{API}/tasks", json={"title": "minha"}, headers=H).json()
    p = client.post(f"{API}/projects", json={"name": "meu"}, headers=H).json()
    assert client.get(f"{API}/notes", headers=other).json() == []
    for path in (f"notes/{n['id']}", f"tasks/{t['id']}", f"projects/{p['id']}"):
        assert client.get(f"{API}/{path}", headers=other).status_code == 404
        assert client.delete(f"{API}/{path}", headers=other).status_code == 404
    assert client.post(f"{API}/tasks", json={"title": "x", "project_id": p["id"]}, headers=other).status_code == 400


# ---------- tarefas
def test_task_lifecycle(client, H):
    p = client.post(f"{API}/projects", json={"name": "P"}, headers=H).json()
    t = client.post(f"{API}/tasks", json={"title": "A", "priority": "alta", "project_id": p["id"], "due_date": "2026-12-01"}, headers=H).json()
    assert not t["done"] and t["completed_at"] is None
    r = client.patch(f"{API}/tasks/{t['id']}", json={"done": True}, headers=H).json()
    assert r["done"] and r["completed_at"]
    assert client.patch(f"{API}/tasks/{t['id']}", json={"done": False}, headers=H).json()["completed_at"] is None
    assert client.patch(f"{API}/tasks/{t['id']}", json={"project_id": None}, headers=H).json()["project_id"] is None
    assert client.post(f"{API}/tasks", json={"title": "x", "priority": "urgente"}, headers=H).status_code == 422
    assert client.post(f"{API}/tasks", json={"title": "x", "project_id": 999}, headers=H).status_code == 400


def test_task_order_filters_and_clear(client, H):
    for title, pr in (("baixa", "baixa"), ("alta", "alta"), ("media", "media")):
        client.post(f"{API}/tasks", json={"title": title, "priority": pr}, headers=H)
    first = client.get(f"{API}/tasks", headers=H).json()
    assert [t["title"] for t in first] == ["alta", "media", "baixa"]
    client.patch(f"{API}/tasks/{first[0]['id']}", json={"done": True}, headers=H)
    assert [t["title"] for t in client.get(f"{API}/tasks", headers=H).json()][-1] == "alta"  # concluídas no fim
    assert len(client.get(f"{API}/tasks", params={"done": False}, headers=H).json()) == 2
    assert client.post(f"{API}/tasks/clear-completed", headers=H).json() == {"deleted": 1}
    assert len(client.get(f"{API}/tasks", headers=H).json()) == 2


# ---------- projetos
def test_project_progress_and_milestones(client, H):
    p = client.post(f"{API}/projects", json={"name": "Fase 2", "phase": 2, "milestones": ["a", "b"]}, headers=H).json()
    assert p["progress"] == 0 and [m["position"] for m in p["milestones"]] == [0, 1]
    mid = p["milestones"][0]["id"]
    client.patch(f"{API}/projects/{p['id']}/milestones/{mid}", json={"done": True}, headers=H)
    assert client.get(f"{API}/projects/{p['id']}", headers=H).json()["progress"] == 50
    client.post(f"{API}/projects/{p['id']}/milestones", json={"title": "c"}, headers=H)
    assert client.get(f"{API}/projects/{p['id']}", headers=H).json()["progress"] == 33
    assert client.patch(f"{API}/projects/{p['id']}/milestones/9999", json={"done": True}, headers=H).status_code == 404
    assert client.delete(f"{API}/projects/{p['id']}/milestones/{mid}", headers=H).status_code == 204
    assert client.get(f"{API}/projects/{p['id']}", headers=H).json()["progress"] == 0
    assert client.post(f"{API}/projects", json={"name": "x", "phase": 9}, headers=H).status_code == 422


def test_delete_project_keeps_tasks(client, H):
    p = client.post(f"{API}/projects", json={"name": "P", "milestones": ["m"]}, headers=H).json()
    t = client.post(f"{API}/tasks", json={"title": "fica", "project_id": p["id"]}, headers=H).json()
    assert client.delete(f"{API}/projects/{p['id']}", headers=H).status_code == 204
    assert client.get(f"{API}/tasks/{t['id']}", headers=H).json()["project_id"] is None


# ---------- dashboard
def test_dashboard(client, H):
    mk_note(client, H, title="Fixa", pinned=True)
    mk_note(client, H)
    client.post(f"{API}/tasks", json={"title": "a", "priority": "alta"}, headers=H)
    done = client.post(f"{API}/tasks", json={"title": "b"}, headers=H).json()
    client.patch(f"{API}/tasks/{done['id']}", json={"done": True}, headers=H)
    p = client.post(f"{API}/projects", json={"name": "P", "milestones": ["x", "y"]}, headers=H).json()
    client.patch(f"{API}/projects/{p['id']}/milestones/{p['milestones'][0]['id']}", json={"done": True}, headers=H)
    d = client.get(f"{API}/dashboard", headers=H).json()
    assert (d["open_tasks"], d["done_tasks"], d["high_priority_open"], d["notes_total"]) == (1, 1, 1, 2)
    assert [n["title"] for n in d["pinned_notes"]] == ["Fixa"]
    assert d["active_projects"] == 1 and d["overall_progress"] == 50
    assert d["recent_activity"] and d["recent_activity"][0]["action"] == "project_created"
