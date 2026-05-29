import pytest
from httpx import AsyncClient, ASGITransport

from app import db
from app.main import app

CREDS = {"username": "testadmin", "password": "testpass123"}


async def get_token(client: AsyncClient) -> str:
    return (await client.post("/api/auth/login", json=CREDS)).json()["access_token"]


def auth_headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


async def create_product(client: AsyncClient, token: str, price: float = 500.0, available: bool = True) -> int:
    resp = await client.post(
        "/api/products",
        json={"name": "商品", "price": price, "is_available": available},
        headers=auth_headers(token),
    )
    return resp.json()["id"]


ORDER_BASE = {
    "customer_name": "王小明",
    "customer_phone": "0912345678",
    "customer_email": "test@example.com",
    "customer_address": "台北市中正區",
    "notes": "備註",
}


@pytest.mark.asyncio
async def test_create_order():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        token = await get_token(c)
        prod_id = await create_product(c, token, price=1280.0)
        resp = await c.post("/api/orders", json={**ORDER_BASE, "items": [{"product_id": prod_id, "quantity": 2}]})
    assert resp.status_code == 201
    body = resp.json()
    assert body["status"] == "pending"
    assert len(body["items"]) == 1
    assert body["items"][0]["unit_price"] == 1280.0
    assert body["items"][0]["quantity"] == 2


@pytest.mark.asyncio
async def test_create_order_no_auth_required():
    """POST /api/orders is public."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        token = await get_token(c)
        prod_id = await create_product(c, token)
        resp = await c.post("/api/orders", json={**ORDER_BASE, "items": [{"product_id": prod_id, "quantity": 1}]})
    assert resp.status_code == 201


@pytest.mark.asyncio
async def test_create_order_empty_items():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        resp = await c.post("/api/orders", json={**ORDER_BASE, "items": []})
    assert resp.status_code == 400


@pytest.mark.asyncio
async def test_create_order_product_not_found():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        resp = await c.post("/api/orders", json={**ORDER_BASE, "items": [{"product_id": 999, "quantity": 1}]})
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_create_order_unavailable_product():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        token = await get_token(c)
        prod_id = await create_product(c, token, available=False)
        resp = await c.post("/api/orders", json={**ORDER_BASE, "items": [{"product_id": prod_id, "quantity": 1}]})
    assert resp.status_code == 400


@pytest.mark.asyncio
async def test_unit_price_snapshotted():
    """Changing product price after order creation must not affect existing order."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        token = await get_token(c)
        prod_id = await create_product(c, token, price=500.0)
        order = (await c.post("/api/orders", json={**ORDER_BASE, "items": [{"product_id": prod_id, "quantity": 1}]})).json()
        original_price = order["items"][0]["unit_price"]

        # Change the product price
        await c.patch(f"/api/products/{prod_id}", json={"price": 9999.0}, headers=auth_headers(token))

        # Fetch the order again and confirm unit_price unchanged
        refreshed = (await c.get(f"/api/orders/{order['id']}", headers=auth_headers(token))).json()

    assert original_price == 500.0
    assert refreshed["items"][0]["unit_price"] == 500.0


@pytest.mark.asyncio
async def test_list_orders_requires_auth():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        resp = await c.get("/api/orders")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_list_orders():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        token = await get_token(c)
        prod_id = await create_product(c, token)
        await c.post("/api/orders", json={**ORDER_BASE, "items": [{"product_id": prod_id, "quantity": 1}]})
        await c.post("/api/orders", json={**ORDER_BASE, "items": [{"product_id": prod_id, "quantity": 1}]})
        resp = await c.get("/api/orders", headers=auth_headers(token))
    assert resp.status_code == 200
    assert len(resp.json()) == 2


@pytest.mark.asyncio
async def test_list_orders_filter_by_status():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        token = await get_token(c)
        hdrs = auth_headers(token)
        prod_id = await create_product(c, token)
        o1 = (await c.post("/api/orders", json={**ORDER_BASE, "items": [{"product_id": prod_id, "quantity": 1}]})).json()
        await c.post("/api/orders", json={**ORDER_BASE, "items": [{"product_id": prod_id, "quantity": 1}]})
        await c.patch(f"/api/orders/{o1['id']}/status", json={"status": "confirmed"}, headers=hdrs)
        resp = await c.get("/api/orders?status=confirmed", headers=hdrs)
    assert len(resp.json()) == 1
    assert resp.json()[0]["status"] == "confirmed"


@pytest.mark.asyncio
async def test_list_orders_invalid_status():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        token = await get_token(c)
        resp = await c.get("/api/orders?status=bogus", headers=auth_headers(token))
    assert resp.status_code == 400


@pytest.mark.asyncio
async def test_get_order():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        token = await get_token(c)
        prod_id = await create_product(c, token)
        order_id = (await c.post("/api/orders", json={**ORDER_BASE, "items": [{"product_id": prod_id, "quantity": 1}]})).json()["id"]
        resp = await c.get(f"/api/orders/{order_id}", headers=auth_headers(token))
    assert resp.status_code == 200
    body = resp.json()
    assert body["id"] == order_id
    assert len(body["items"]) == 1
    assert body["items"][0]["product_name"] is not None


@pytest.mark.asyncio
async def test_get_order_not_found():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        token = await get_token(c)
        resp = await c.get("/api/orders/999", headers=auth_headers(token))
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_get_order_requires_auth():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        token = await get_token(c)
        prod_id = await create_product(c, token)
        order_id = (await c.post("/api/orders", json={**ORDER_BASE, "items": [{"product_id": prod_id, "quantity": 1}]})).json()["id"]
        resp = await c.get(f"/api/orders/{order_id}")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_update_status():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        token = await get_token(c)
        prod_id = await create_product(c, token)
        order_id = (await c.post("/api/orders", json={**ORDER_BASE, "items": [{"product_id": prod_id, "quantity": 1}]})).json()["id"]
        resp = await c.patch(f"/api/orders/{order_id}/status", json={"status": "confirmed"}, headers=auth_headers(token))
    assert resp.status_code == 200
    assert resp.json()["status"] == "confirmed"


@pytest.mark.asyncio
async def test_update_status_invalid():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        token = await get_token(c)
        prod_id = await create_product(c, token)
        order_id = (await c.post("/api/orders", json={**ORDER_BASE, "items": [{"product_id": prod_id, "quantity": 1}]})).json()["id"]
        resp = await c.patch(f"/api/orders/{order_id}/status", json={"status": "flying"}, headers=auth_headers(token))
    assert resp.status_code == 400


@pytest.mark.asyncio
async def test_update_status_not_found():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        token = await get_token(c)
        resp = await c.patch("/api/orders/999/status", json={"status": "confirmed"}, headers=auth_headers(token))
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_update_status_requires_auth():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        token = await get_token(c)
        prod_id = await create_product(c, token)
        order_id = (await c.post("/api/orders", json={**ORDER_BASE, "items": [{"product_id": prod_id, "quantity": 1}]})).json()["id"]
        resp = await c.patch(f"/api/orders/{order_id}/status", json={"status": "confirmed"})
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_get_order_public():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        token = await get_token(c)
        prod_id = await create_product(c, token, price=800.0)
        order_id = (await c.post("/api/orders", json={**ORDER_BASE, "items": [{"product_id": prod_id, "quantity": 2}]})).json()["id"]
        resp = await c.get(f"/api/orders/{order_id}/public")
    assert resp.status_code == 200
    body = resp.json()
    assert body["id"] == order_id
    assert body["status"] == "pending"
    assert len(body["items"]) == 1
    assert body["items"][0]["quantity"] == 2
    assert "customer_name" not in body
    assert "customer_phone" not in body


@pytest.mark.asyncio
async def test_get_order_public_not_found():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        resp = await c.get("/api/orders/999/public")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_cancel_from_any_status():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        token = await get_token(c)
        hdrs = auth_headers(token)
        prod_id = await create_product(c, token)
        order_id = (await c.post("/api/orders", json={**ORDER_BASE, "items": [{"product_id": prod_id, "quantity": 1}]})).json()["id"]
        await c.patch(f"/api/orders/{order_id}/status", json={"status": "confirmed"}, headers=hdrs)
        await c.patch(f"/api/orders/{order_id}/status", json={"status": "shipped"}, headers=hdrs)
        resp = await c.patch(f"/api/orders/{order_id}/status", json={"status": "cancelled"}, headers=hdrs)
    assert resp.json()["status"] == "cancelled"
