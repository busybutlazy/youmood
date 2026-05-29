import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile, status
from fastapi.responses import FileResponse
from pydantic import BaseModel

from app import db
from app.deps import get_current_admin

router = APIRouter(tags=["images"])


class ImageUpdate(BaseModel):
    is_primary: bool | None = None
    sort_order: int | None = None


@router.post("/api/products/{product_id}/images", status_code=status.HTTP_201_CREATED)
async def upload_image(
    product_id: int,
    file: UploadFile,
    request: Request,
    _: str = Depends(get_current_admin),
):
    with db.get_conn() as conn:
        if conn.execute("SELECT id FROM products WHERE id = ?", (product_id,)).fetchone() is None:
            raise HTTPException(status_code=404, detail="Product not found")
        count = conn.execute(
            "SELECT COUNT(*) FROM product_images WHERE product_id = ?", (product_id,)
        ).fetchone()[0]
        is_primary = 1 if count == 0 else 0
        sort_order = conn.execute(
            "SELECT COALESCE(MAX(sort_order) + 1, 0) FROM product_images WHERE product_id = ?",
            (product_id,),
        ).fetchone()[0]

    suffix = Path(file.filename or "image").suffix or ".jpg"
    filename = f"{uuid.uuid4().hex}{suffix}"
    product_dir = db.IMAGES_DIR / str(product_id)
    product_dir.mkdir(parents=True, exist_ok=True)
    (product_dir / filename).write_bytes(await file.read())

    relative_path = f"products/{product_id}/{filename}"
    with db.get_conn() as conn:
        cur = conn.execute(
            "INSERT INTO product_images (product_id, path, is_primary, sort_order) VALUES (?, ?, ?, ?)",
            (product_id, relative_path, is_primary, sort_order),
        )
        img = conn.execute(
            "SELECT id, path, is_primary, sort_order FROM product_images WHERE id = ?",
            (cur.lastrowid,),
        ).fetchone()

    base = str(request.base_url).rstrip("/")
    return {
        "id": img["id"],
        "url": f"{base}/api/images/{img['path']}",
        "is_primary": bool(img["is_primary"]),
        "sort_order": img["sort_order"],
    }


@router.delete(
    "/api/products/{product_id}/images/{image_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_image(
    product_id: int,
    image_id: int,
    _: str = Depends(get_current_admin),
):
    with db.get_conn() as conn:
        img = conn.execute(
            "SELECT path FROM product_images WHERE id = ? AND product_id = ?",
            (image_id, product_id),
        ).fetchone()
        if img is None:
            raise HTTPException(status_code=404, detail="Image not found")
        conn.execute("DELETE FROM product_images WHERE id = ?", (image_id,))

    file_path = db.IMAGES_DIR.parent / img["path"]
    if file_path.exists():
        file_path.unlink()


@router.patch("/api/products/{product_id}/images/{image_id}")
def update_image(
    product_id: int,
    image_id: int,
    body: ImageUpdate,
    request: Request,
    _: str = Depends(get_current_admin),
):
    with db.get_conn() as conn:
        img = conn.execute(
            "SELECT id, path, is_primary, sort_order FROM product_images WHERE id = ? AND product_id = ?",
            (image_id, product_id),
        ).fetchone()
        if img is None:
            raise HTTPException(status_code=404, detail="Image not found")

        if body.is_primary is True:
            conn.execute(
                "UPDATE product_images SET is_primary = 0 WHERE product_id = ?", (product_id,)
            )
            conn.execute("UPDATE product_images SET is_primary = 1 WHERE id = ?", (image_id,))
        elif body.is_primary is False:
            conn.execute("UPDATE product_images SET is_primary = 0 WHERE id = ?", (image_id,))

        if body.sort_order is not None:
            conn.execute(
                "UPDATE product_images SET sort_order = ? WHERE id = ?",
                (body.sort_order, image_id),
            )

        img = conn.execute(
            "SELECT id, path, is_primary, sort_order FROM product_images WHERE id = ?",
            (image_id,),
        ).fetchone()

    base = str(request.base_url).rstrip("/")
    return {
        "id": img["id"],
        "url": f"{base}/api/images/{img['path']}",
        "is_primary": bool(img["is_primary"]),
        "sort_order": img["sort_order"],
    }


@router.get("/api/images/{path:path}")
def get_image(path: str):
    images_base = db.IMAGES_DIR.parent.resolve()
    file_path = (images_base / path).resolve()
    # prevent path traversal
    if not str(file_path).startswith(str(images_base)):
        raise HTTPException(status_code=400, detail="Invalid path")
    if not file_path.is_file():
        raise HTTPException(status_code=404, detail="Image not found")
    return FileResponse(file_path)
