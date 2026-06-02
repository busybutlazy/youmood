import io
import pytest
from httpx import AsyncClient, ASGITransport

from app.main import app

CREDS = {"username": "testadmin", "password": "testpass123"}


async def get_token(client):
    return (await client.post("/api/auth/login", json=CREDS)).json()["access_token"]


def hdrs(token):
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
async def test_get_content_unknown_key():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        resp = await c.get("/api/site-content/home/nonexistent")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_get_content_returns_null_when_unset():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        resp = await c.get("/api/site-content/home/tagline")
    assert resp.status_code == 200
    assert resp.json()["value"] is None


@pytest.mark.asyncio
async def test_get_page_content_returns_all_keys():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        resp = await c.get("/api/site-content/contact")
    assert resp.status_code == 200
    body = resp.json()
    assert "email" in body
    assert "instagram" in body
    assert "hours" in body
    assert "location" in body


@pytest.mark.asyncio
async def test_update_text_requires_auth():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        resp = await c.put("/api/admin/site-content", json={"page": "home", "key": "tagline", "value": "test"})
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_update_text_and_read_back():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        token = await get_token(c)
        resp = await c.put(
            "/api/admin/site-content",
            json={"page": "home", "key": "tagline", "value": "手作温度"},
            headers=hdrs(token),
        )
        assert resp.status_code == 200

        resp2 = await c.get("/api/site-content/home/tagline")
    assert resp2.json()["value"] == "手作温度"


@pytest.mark.asyncio
async def test_update_text_idempotent():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        token = await get_token(c)
        h = hdrs(token)
        await c.put("/api/admin/site-content", json={"page": "home", "key": "subtitle", "value": "v1"}, headers=h)
        await c.put("/api/admin/site-content", json={"page": "home", "key": "subtitle", "value": "v2"}, headers=h)
        resp = await c.get("/api/site-content/home/subtitle")
    assert resp.json()["value"] == "v2"


@pytest.mark.asyncio
async def test_update_text_rejects_image_field():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        token = await get_token(c)
        resp = await c.put(
            "/api/admin/site-content",
            json={"page": "home", "key": "hero_image", "value": "should-fail"},
            headers=hdrs(token),
        )
    assert resp.status_code == 400


@pytest.mark.asyncio
async def test_upload_image_requires_auth():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        resp = await c.post(
            "/api/admin/site-content/image?page=home&key=hero_image",
            files={"file": ("hero.jpg", io.BytesIO(b"fake"), "image/jpeg")},
        )
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_upload_image_and_read_back():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        token = await get_token(c)
        resp = await c.post(
            "/api/admin/site-content/image?page=home&key=hero_image",
            files={"file": ("hero.jpg", io.BytesIO(b"\xff\xd8\xff"), "image/jpeg")},
            headers=hdrs(token),
        )
        assert resp.status_code == 200
        url = resp.json()["url"]
        assert "site/" in url

        resp2 = await c.get("/api/site-content/home/hero_image")
    assert resp2.json()["value"] is not None
    assert "site/" in resp2.json()["value"]


@pytest.mark.asyncio
async def test_batch_update_requires_auth():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        resp = await c.put(
            "/api/admin/site-content/batch",
            json=[{"page": "home", "key": "tagline", "value": "test"}],
        )
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_batch_update_saves_atomically():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        token = await get_token(c)
        resp = await c.put(
            "/api/admin/site-content/batch",
            json=[
                {"page": "home", "key": "tagline", "value": "批次標題"},
                {"page": "home", "key": "subtitle", "value": "批次副標"},
            ],
            headers=hdrs(token),
        )
        assert resp.status_code == 200
        assert len(resp.json()) == 2

        r1 = await c.get("/api/site-content/home/tagline")
        r2 = await c.get("/api/site-content/home/subtitle")
    assert r1.json()["value"] == "批次標題"
    assert r2.json()["value"] == "批次副標"


@pytest.mark.asyncio
async def test_batch_update_rejects_unknown_key():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        token = await get_token(c)
        resp = await c.put(
            "/api/admin/site-content/batch",
            json=[{"page": "home", "key": "nonexistent", "value": "x"}],
            headers=hdrs(token),
        )
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_batch_update_rejects_image_field():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        token = await get_token(c)
        resp = await c.put(
            "/api/admin/site-content/batch",
            json=[{"page": "home", "key": "hero_image", "value": "bad"}],
            headers=hdrs(token),
        )
    assert resp.status_code == 400


@pytest.mark.asyncio
async def test_update_alembic_version():
    import sqlite3
    from app import db
    db.init()
    with sqlite3.connect(db.DB_PATH) as conn:
        row = conn.execute("SELECT version_num FROM alembic_version").fetchone()
    assert row[0] == "0003"
