import pytest
from httpx import AsyncClient, ASGITransport

from app import db
from app.main import app

CREDS = {"username": "testadmin", "password": "testpass123"}
FAKE_IMAGE = b"\x89PNG\r\n\x1a\n" + b"\x00" * 100


async def get_token(client: AsyncClient) -> str:
    return (await client.post("/api/auth/login", json=CREDS)).json()["access_token"]


def auth_headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


async def create_product(client: AsyncClient, token: str) -> int:
    resp = await client.post(
        "/api/products",
        json={"name": "商品", "price": 100.0},
        headers=auth_headers(token),
    )
    return resp.json()["id"]


async def upload(client: AsyncClient, token: str, prod_id: int, name: str = "test.jpg") -> dict:
    resp = await client.post(
        f"/api/products/{prod_id}/images",
        files={"file": (name, FAKE_IMAGE, "image/jpeg")},
        headers=auth_headers(token),
    )
    return resp.json()


@pytest.mark.asyncio
async def test_upload_image():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        token = await get_token(c)
        prod_id = await create_product(c, token)
        resp = await c.post(
            f"/api/products/{prod_id}/images",
            files={"file": ("test.jpg", FAKE_IMAGE, "image/jpeg")},
            headers=auth_headers(token),
        )
    assert resp.status_code == 201
    body = resp.json()
    assert "url" in body
    assert body["is_primary"] is True
    assert body["sort_order"] == 0


@pytest.mark.asyncio
async def test_upload_creates_file_on_disk():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        token = await get_token(c)
        prod_id = await create_product(c, token)
        img = await upload(c, token, prod_id)

    path = img["url"].split("/api/images/")[1]
    file_path = db.IMAGES_DIR.parent / path
    assert file_path.exists()
    assert file_path.read_bytes() == FAKE_IMAGE


@pytest.mark.asyncio
async def test_second_image_not_primary():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        token = await get_token(c)
        prod_id = await create_product(c, token)
        hdrs = auth_headers(token)
        await c.post(f"/api/products/{prod_id}/images", files={"file": ("a.jpg", FAKE_IMAGE, "image/jpeg")}, headers=hdrs)
        resp = await c.post(f"/api/products/{prod_id}/images", files={"file": ("b.jpg", FAKE_IMAGE, "image/jpeg")}, headers=hdrs)
    assert resp.json()["is_primary"] is False
    assert resp.json()["sort_order"] == 1


@pytest.mark.asyncio
async def test_product_detail_includes_images():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        token = await get_token(c)
        prod_id = await create_product(c, token)
        await upload(c, token, prod_id)
        resp = await c.get(f"/api/products/{prod_id}")
    images = resp.json()["images"]
    assert len(images) == 1
    assert images[0]["url"].startswith("http://test/api/images/")
    assert images[0]["is_primary"] is True


@pytest.mark.asyncio
async def test_serve_image():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        token = await get_token(c)
        prod_id = await create_product(c, token)
        img = await upload(c, token, prod_id)
        path = img["url"].replace("http://test", "")
        resp = await c.get(path)
    assert resp.status_code == 200
    assert resp.content == FAKE_IMAGE


@pytest.mark.asyncio
async def test_serve_image_not_found():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        resp = await c.get("/api/images/products/999/nonexistent.jpg")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_delete_image_removes_file_and_record():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        token = await get_token(c)
        prod_id = await create_product(c, token)
        hdrs = auth_headers(token)
        img = await upload(c, token, prod_id)
        img_id = img["id"]
        file_path = db.IMAGES_DIR.parent / img["url"].split("/api/images/")[1]

        assert file_path.exists()
        resp = await c.delete(f"/api/products/{prod_id}/images/{img_id}", headers=hdrs)
        assert resp.status_code == 204
        assert not file_path.exists()

        detail = (await c.get(f"/api/products/{prod_id}")).json()
    assert detail["images"] == []


@pytest.mark.asyncio
async def test_delete_image_not_found():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        token = await get_token(c)
        prod_id = await create_product(c, token)
        resp = await c.delete(f"/api/products/{prod_id}/images/999", headers=auth_headers(token))
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_delete_image_requires_auth():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        token = await get_token(c)
        prod_id = await create_product(c, token)
        img = await upload(c, token, prod_id)
        resp = await c.delete(f"/api/products/{prod_id}/images/{img['id']}")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_set_primary_clears_previous():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        token = await get_token(c)
        prod_id = await create_product(c, token)
        hdrs = auth_headers(token)
        img1 = await upload(c, token, prod_id, "a.jpg")
        img2 = await upload(c, token, prod_id, "b.jpg")
        assert img1["is_primary"] is True
        assert img2["is_primary"] is False

        await c.patch(
            f"/api/products/{prod_id}/images/{img2['id']}",
            json={"is_primary": True},
            headers=hdrs,
        )
        product = (await c.get(f"/api/products/{prod_id}")).json()

    by_id = {i["id"]: i for i in product["images"]}
    assert by_id[img1["id"]]["is_primary"] is False
    assert by_id[img2["id"]]["is_primary"] is True


@pytest.mark.asyncio
async def test_update_sort_order():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        token = await get_token(c)
        prod_id = await create_product(c, token)
        img = await upload(c, token, prod_id)
        resp = await c.patch(
            f"/api/products/{prod_id}/images/{img['id']}",
            json={"sort_order": 5},
            headers=auth_headers(token),
        )
    assert resp.json()["sort_order"] == 5


@pytest.mark.asyncio
async def test_upload_requires_auth():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        token = await get_token(c)
        prod_id = await create_product(c, token)
        resp = await c.post(
            f"/api/products/{prod_id}/images",
            files={"file": ("test.jpg", FAKE_IMAGE, "image/jpeg")},
        )
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_upload_product_not_found():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        token = await get_token(c)
        resp = await c.post(
            "/api/products/999/images",
            files={"file": ("test.jpg", FAKE_IMAGE, "image/jpeg")},
            headers=auth_headers(token),
        )
    assert resp.status_code == 404
