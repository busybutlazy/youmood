import pytest
from httpx import AsyncClient, ASGITransport

from app.main import app

CREDS = {"username": "testadmin", "password": "testpass123"}


async def get_token(client: AsyncClient) -> str:
    resp = await client.post("/api/auth/login", json=CREDS)
    return resp.json()["access_token"]


def auth_headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
async def test_list_products_empty():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        resp = await c.get("/api/products")
    assert resp.status_code == 200
    assert resp.json() == []


@pytest.mark.asyncio
async def test_create_product():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        token = await get_token(c)
        resp = await c.post(
            "/api/products",
            json={"name": "胡桃木餐盤", "price": 1280.0},
            headers=auth_headers(token),
        )
    assert resp.status_code == 201
    body = resp.json()
    assert body["name"] == "胡桃木餐盤"
    assert body["price"] == 1280.0
    assert body["category_id"] is None
    assert body["is_available"] is True
    assert body["images"] == []


@pytest.mark.asyncio
async def test_create_product_requires_auth():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        resp = await c.post("/api/products", json={"name": "x", "price": 1.0})
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_create_product_with_category():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        token = await get_token(c)
        hdrs = auth_headers(token)
        cat_id = (await c.post("/api/categories", json={"name": "木製品"}, headers=hdrs)).json()["id"]
        resp = await c.post(
            "/api/products",
            json={"name": "木盤", "price": 500.0, "category_id": cat_id},
            headers=hdrs,
        )
    assert resp.status_code == 201
    body = resp.json()
    assert body["category_id"] == cat_id
    assert body["category_name"] == "木製品"


@pytest.mark.asyncio
async def test_create_product_invalid_category():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        token = await get_token(c)
        resp = await c.post(
            "/api/products",
            json={"name": "x", "price": 1.0, "category_id": 999},
            headers=auth_headers(token),
        )
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_get_product():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        token = await get_token(c)
        prod_id = (await c.post(
            "/api/products",
            json={"name": "木盤", "price": 500.0},
            headers=auth_headers(token),
        )).json()["id"]
        resp = await c.get(f"/api/products/{prod_id}")
    assert resp.status_code == 200
    assert resp.json()["id"] == prod_id


@pytest.mark.asyncio
async def test_get_product_not_found():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        resp = await c.get("/api/products/999")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_list_products_filter_by_category():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        token = await get_token(c)
        hdrs = auth_headers(token)
        cat_id = (await c.post("/api/categories", json={"name": "木製品"}, headers=hdrs)).json()["id"]
        await c.post("/api/products", json={"name": "木盤", "price": 500.0, "category_id": cat_id}, headers=hdrs)
        await c.post("/api/products", json={"name": "無類商品", "price": 100.0}, headers=hdrs)
        resp = await c.get(f"/api/products?category_id={cat_id}")
    items = resp.json()
    assert len(items) == 1
    assert items[0]["name"] == "木盤"


@pytest.mark.asyncio
async def test_list_products_available_only():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        token = await get_token(c)
        hdrs = auth_headers(token)
        await c.post("/api/products", json={"name": "上架", "price": 100.0, "is_available": True}, headers=hdrs)
        await c.post("/api/products", json={"name": "下架", "price": 200.0, "is_available": False}, headers=hdrs)
        resp = await c.get("/api/products?available_only=true")
    items = resp.json()
    assert len(items) == 1
    assert items[0]["name"] == "上架"


@pytest.mark.asyncio
async def test_update_product():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        token = await get_token(c)
        hdrs = auth_headers(token)
        prod_id = (await c.post(
            "/api/products", json={"name": "舊名", "price": 100.0}, headers=hdrs
        )).json()["id"]
        resp = await c.patch(f"/api/products/{prod_id}", json={"name": "新名", "price": 200.0}, headers=hdrs)
    assert resp.status_code == 200
    body = resp.json()
    assert body["name"] == "新名"
    assert body["price"] == 200.0


@pytest.mark.asyncio
async def test_update_product_requires_auth():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        token = await get_token(c)
        prod_id = (await c.post(
            "/api/products", json={"name": "x", "price": 1.0}, headers=auth_headers(token)
        )).json()["id"]
        resp = await c.patch(f"/api/products/{prod_id}", json={"price": 2.0})
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_update_product_not_found():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        token = await get_token(c)
        resp = await c.patch("/api/products/999", json={"price": 1.0}, headers=auth_headers(token))
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_delete_product():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        token = await get_token(c)
        hdrs = auth_headers(token)
        prod_id = (await c.post(
            "/api/products", json={"name": "x", "price": 1.0}, headers=hdrs
        )).json()["id"]
        resp = await c.delete(f"/api/products/{prod_id}", headers=hdrs)
        assert resp.status_code == 204
        resp2 = await c.get(f"/api/products/{prod_id}")
    assert resp2.status_code == 404


@pytest.mark.asyncio
async def test_delete_product_requires_auth():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        token = await get_token(c)
        prod_id = (await c.post(
            "/api/products", json={"name": "x", "price": 1.0}, headers=auth_headers(token)
        )).json()["id"]
        resp = await c.delete(f"/api/products/{prod_id}")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_product_list_includes_category_name():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        token = await get_token(c)
        hdrs = auth_headers(token)
        cat_id = (await c.post("/api/categories", json={"name": "木製品"}, headers=hdrs)).json()["id"]
        await c.post("/api/products", json={"name": "木盤", "price": 500.0, "category_id": cat_id}, headers=hdrs)
        resp = await c.get("/api/products")
    assert resp.json()[0]["category_name"] == "木製品"
