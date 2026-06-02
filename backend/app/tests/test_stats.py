import pytest
from httpx import AsyncClient, ASGITransport

from app.main import app

CREDS = {"username": "testadmin", "password": "testpass123"}


async def get_token(client):
    return (await client.post("/api/auth/login", json=CREDS)).json()["access_token"]


def hdrs(token):
    return {"Authorization": f"Bearer {token}"}


ORDER_BASE = {
    "customer_name": "王小明",
    "customer_phone": "0912345678",
    "customer_email": "test@example.com",
}


@pytest.mark.asyncio
async def test_stats_requires_auth():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        resp = await c.get("/api/admin/stats")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_stats_empty():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        token = await get_token(c)
        resp = await c.get("/api/admin/stats", headers=hdrs(token))
    assert resp.status_code == 200
    body = resp.json()
    assert body["total_orders"] == 0
    assert body["revenue"] == 0
    assert body["pending_count"] == 0
    assert body["top_products"] == []


@pytest.mark.asyncio
async def test_stats_counts_orders():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        token = await get_token(c)
        h = hdrs(token)
        prod_id = (await c.post("/api/products", json={"name": "木盤", "price": 500.0}, headers=h)).json()["id"]
        await c.post("/api/orders", json={**ORDER_BASE, "items": [{"product_id": prod_id, "quantity": 2}]})
        await c.post("/api/orders", json={**ORDER_BASE, "items": [{"product_id": prod_id, "quantity": 1}]})
        resp = await c.get("/api/admin/stats", headers=h)
    body = resp.json()
    assert body["total_orders"] == 2
    assert body["revenue"] == 500.0 * 3
    assert body["pending_count"] == 2
    assert len(body["top_products"]) == 1
    assert body["top_products"][0]["total_qty"] == 3


@pytest.mark.asyncio
async def test_stats_excludes_cancelled():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        token = await get_token(c)
        h = hdrs(token)
        prod_id = (await c.post("/api/products", json={"name": "木盤", "price": 800.0}, headers=h)).json()["id"]
        order_id = (await c.post("/api/orders", json={**ORDER_BASE, "items": [{"product_id": prod_id, "quantity": 1}]})).json()["id"]
        await c.patch(f"/api/orders/{order_id}/status", json={"status": "cancelled"}, headers=h)
        resp = await c.get("/api/admin/stats", headers=h)
    body = resp.json()
    assert body["total_orders"] == 0
    assert body["revenue"] == 0


@pytest.mark.asyncio
async def test_orders_search():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        token = await get_token(c)
        h = hdrs(token)
        prod_id = (await c.post("/api/products", json={"name": "木盤", "price": 100.0}, headers=h)).json()["id"]
        await c.post("/api/orders", json={"customer_name": "王小明", "customer_phone": "09", "customer_email": "wang@test.com", "items": [{"product_id": prod_id, "quantity": 1}]})
        await c.post("/api/orders", json={"customer_name": "李美麗", "customer_phone": "09", "customer_email": "li@test.com", "items": [{"product_id": prod_id, "quantity": 1}]})
        resp = await c.get("/api/orders?search=王", headers=h)
    assert resp.status_code == 200
    assert len(resp.json()) == 1
    assert resp.json()[0]["customer_name"] == "王小明"


@pytest.mark.asyncio
async def test_orders_search_by_email():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        token = await get_token(c)
        h = hdrs(token)
        prod_id = (await c.post("/api/products", json={"name": "木盤", "price": 100.0}, headers=h)).json()["id"]
        await c.post("/api/orders", json={"customer_name": "王小明", "customer_phone": "09", "customer_email": "wang@test.com", "items": [{"product_id": prod_id, "quantity": 1}]})
        await c.post("/api/orders", json={"customer_name": "李美麗", "customer_phone": "09", "customer_email": "li@test.com", "items": [{"product_id": prod_id, "quantity": 1}]})
        resp = await c.get("/api/orders?search=li@", headers=h)
    assert len(resp.json()) == 1
    assert resp.json()[0]["customer_name"] == "李美麗"
