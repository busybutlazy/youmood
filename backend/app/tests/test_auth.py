import pytest
from httpx import AsyncClient, ASGITransport

from app import db, seed
from app.main import app

CREDS = {"username": "testadmin", "password": "testpass123"}


@pytest.fixture(autouse=True)
def isolated_db(tmp_path, monkeypatch):
    from app.deps import pwd_context
    monkeypatch.setattr(db, "DB_PATH", tmp_path / "db" / "youmood.db")
    monkeypatch.setattr(db, "IMAGES_DIR", tmp_path / "images" / "products")
    # ASGITransport 不觸發 lifespan，直接在 fixture 初始化
    db.init()
    with db.get_conn() as conn:
        conn.execute(
            "INSERT INTO admin_users (username, password_hash) VALUES (?, ?)",
            ("testadmin", pwd_context.hash("testpass123")),
        )


@pytest.mark.asyncio
async def test_login_success():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.post("/api/auth/login", json=CREDS)
    assert resp.status_code == 200
    body = resp.json()
    assert "access_token" in body
    assert body["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_login_wrong_password():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.post("/api/auth/login", json={**CREDS, "password": "wrong"})
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_login_unknown_user():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.post("/api/auth/login", json={**CREDS, "username": "nobody"})
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_me_with_valid_token():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        token = (await client.post("/api/auth/login", json=CREDS)).json()["access_token"]
        resp = await client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    assert resp.json()["username"] == "testadmin"


@pytest.mark.asyncio
async def test_me_without_token():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.get("/api/auth/me")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_me_with_invalid_token():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.get("/api/auth/me", headers={"Authorization": "Bearer totally.invalid.token"})
    assert resp.status_code == 401
