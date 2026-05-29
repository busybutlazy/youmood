import pytest
from httpx import AsyncClient, ASGITransport

from app import db
from app.main import app

CREDS = {"username": "testadmin", "password": "testpass123"}


async def get_token(client: AsyncClient) -> str:
    resp = await client.post("/api/auth/login", json=CREDS)
    return resp.json()["access_token"]


def auth_headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
async def test_list_categories_empty():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        resp = await c.get("/api/categories")
    assert resp.status_code == 200
    assert resp.json() == []


@pytest.mark.asyncio
async def test_create_category():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        token = await get_token(c)
        resp = await c.post("/api/categories", json={"name": "木製品"}, headers=auth_headers(token))
    assert resp.status_code == 201
    body = resp.json()
    assert body["name"] == "木製品"
    assert body["sort_order"] == 0
    assert "id" in body


@pytest.mark.asyncio
async def test_create_category_requires_auth():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        resp = await c.post("/api/categories", json={"name": "木製品"})
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_create_duplicate_category():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        token = await get_token(c)
        hdrs = auth_headers(token)
        await c.post("/api/categories", json={"name": "木製品"}, headers=hdrs)
        resp = await c.post("/api/categories", json={"name": "木製品"}, headers=hdrs)
    assert resp.status_code == 400


@pytest.mark.asyncio
async def test_list_categories_sorted():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        token = await get_token(c)
        hdrs = auth_headers(token)
        await c.post("/api/categories", json={"name": "乙", "sort_order": 2}, headers=hdrs)
        await c.post("/api/categories", json={"name": "甲", "sort_order": 1}, headers=hdrs)
        resp = await c.get("/api/categories")
    names = [r["name"] for r in resp.json()]
    assert names == ["甲", "乙"]


@pytest.mark.asyncio
async def test_update_category():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        token = await get_token(c)
        hdrs = auth_headers(token)
        cat_id = (await c.post("/api/categories", json={"name": "舊名"}, headers=hdrs)).json()["id"]
        resp = await c.patch(f"/api/categories/{cat_id}", json={"name": "新名"}, headers=hdrs)
    assert resp.status_code == 200
    assert resp.json()["name"] == "新名"


@pytest.mark.asyncio
async def test_update_category_not_found():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        token = await get_token(c)
        resp = await c.patch("/api/categories/999", json={"name": "x"}, headers=auth_headers(token))
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_delete_category():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        token = await get_token(c)
        hdrs = auth_headers(token)
        cat_id = (await c.post("/api/categories", json={"name": "刪掉"}, headers=hdrs)).json()["id"]
        resp = await c.delete(f"/api/categories/{cat_id}", headers=hdrs)
        assert resp.status_code == 204
        cats = (await c.get("/api/categories")).json()
    assert all(c["id"] != cat_id for c in cats)


@pytest.mark.asyncio
async def test_delete_category_sets_product_category_null():
    """刪除分類後，關聯商品的 category_id 應變為 NULL。"""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        token = await get_token(c)
        hdrs = auth_headers(token)
        cat_id = (await c.post("/api/categories", json={"name": "測試分類"}, headers=hdrs)).json()["id"]
        prod = (await c.post(
            "/api/products",
            json={"name": "測試商品", "price": 100.0, "category_id": cat_id},
            headers=hdrs,
        )).json()
        await c.delete(f"/api/categories/{cat_id}", headers=hdrs)
        detail = (await c.get(f"/api/products/{prod['id']}")).json()
    assert detail["category_id"] is None
    assert detail["category_name"] is None


@pytest.mark.asyncio
async def test_delete_category_requires_auth():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        token = await get_token(c)
        cat_id = (await c.post(
            "/api/categories", json={"name": "x"}, headers=auth_headers(token)
        )).json()["id"]
        resp = await c.delete(f"/api/categories/{cat_id}")
    assert resp.status_code == 401
