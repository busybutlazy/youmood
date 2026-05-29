from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel

from app import db
from app.deps import get_current_admin

router = APIRouter(prefix="/api/products", tags=["products"])


class ProductCreate(BaseModel):
    name: str
    description: str | None = None
    price: float
    category_id: int | None = None
    is_available: bool = True


class ProductUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    price: float | None = None
    category_id: int | None = None
    is_available: bool | None = None


def _build_product(row, images: list, request: Request) -> dict:
    base = str(request.base_url).rstrip("/")
    return {
        "id": row["id"],
        "name": row["name"],
        "description": row["description"],
        "price": row["price"],
        "category_id": row["category_id"],
        "category_name": row["category_name"],
        "is_available": bool(row["is_available"]),
        "images": [
            {
                "id": img["id"],
                "url": f"{base}/api/images/{img['path']}",
                "is_primary": bool(img["is_primary"]),
                "sort_order": img["sort_order"],
            }
            for img in images
        ],
        "created_at": row["created_at"],
    }


@router.get("")
def list_products(
    request: Request,
    category_id: int | None = None,
    available_only: bool = False,
):
    conditions = []
    params: list = []

    if category_id is not None:
        conditions.append("p.category_id = ?")
        params.append(category_id)
    if available_only:
        conditions.append("p.is_available = 1")

    where = ("WHERE " + " AND ".join(conditions)) if conditions else ""
    sql = f"""
        SELECT p.id, p.name, p.description, p.price, p.category_id,
               c.name AS category_name, p.is_available, p.created_at
        FROM products p
        LEFT JOIN categories c ON c.id = p.category_id
        {where}
        ORDER BY p.id
    """
    with db.get_conn() as conn:
        rows = conn.execute(sql, params).fetchall()
        result = []
        for row in rows:
            imgs = conn.execute(
                "SELECT id, path, is_primary, sort_order FROM product_images "
                "WHERE product_id = ? ORDER BY sort_order, id",
                (row["id"],),
            ).fetchall()
            result.append(_build_product(row, imgs, request))
    return result


@router.get("/{product_id}")
def get_product(product_id: int, request: Request):
    with db.get_conn() as conn:
        row = conn.execute(
            """
            SELECT p.id, p.name, p.description, p.price, p.category_id,
                   c.name AS category_name, p.is_available, p.created_at
            FROM products p
            LEFT JOIN categories c ON c.id = p.category_id
            WHERE p.id = ?
            """,
            (product_id,),
        ).fetchone()
        if row is None:
            raise HTTPException(status_code=404, detail="Product not found")
        imgs = conn.execute(
            "SELECT id, path, is_primary, sort_order FROM product_images "
            "WHERE product_id = ? ORDER BY sort_order, id",
            (product_id,),
        ).fetchall()
    return _build_product(row, imgs, request)


@router.post("", status_code=status.HTTP_201_CREATED)
def create_product(
    request: Request,
    body: ProductCreate,
    _: str = Depends(get_current_admin),
):
    with db.get_conn() as conn:
        if body.category_id is not None:
            exists = conn.execute(
                "SELECT id FROM categories WHERE id = ?", (body.category_id,)
            ).fetchone()
            if exists is None:
                raise HTTPException(status_code=404, detail="Category not found")

        cur = conn.execute(
            "INSERT INTO products (name, description, price, category_id, is_available) "
            "VALUES (?, ?, ?, ?, ?)",
            (body.name, body.description, body.price, body.category_id, int(body.is_available)),
        )
        row = conn.execute(
            """
            SELECT p.id, p.name, p.description, p.price, p.category_id,
                   c.name AS category_name, p.is_available, p.created_at
            FROM products p LEFT JOIN categories c ON c.id = p.category_id
            WHERE p.id = ?
            """,
            (cur.lastrowid,),
        ).fetchone()
    return _build_product(row, [], request)


@router.patch("/{product_id}")
def update_product(
    product_id: int,
    request: Request,
    body: ProductUpdate,
    _: str = Depends(get_current_admin),
):
    with db.get_conn() as conn:
        existing = conn.execute(
            "SELECT id FROM products WHERE id = ?", (product_id,)
        ).fetchone()
        if existing is None:
            raise HTTPException(status_code=404, detail="Product not found")

        fields: list[tuple] = []
        if body.name is not None:
            fields.append(("name", body.name))
        if body.description is not None:
            fields.append(("description", body.description))
        if body.price is not None:
            fields.append(("price", body.price))
        if body.category_id is not None:
            cat = conn.execute(
                "SELECT id FROM categories WHERE id = ?", (body.category_id,)
            ).fetchone()
            if cat is None:
                raise HTTPException(status_code=404, detail="Category not found")
            fields.append(("category_id", body.category_id))
        if body.is_available is not None:
            fields.append(("is_available", int(body.is_available)))

        if fields:
            set_clause = ", ".join(f"{col} = ?" for col, _ in fields)
            values = [v for _, v in fields] + [product_id]
            conn.execute(
                f"UPDATE products SET {set_clause}, updated_at = datetime('now') WHERE id = ?",
                values,
            )

        row = conn.execute(
            """
            SELECT p.id, p.name, p.description, p.price, p.category_id,
                   c.name AS category_name, p.is_available, p.created_at
            FROM products p LEFT JOIN categories c ON c.id = p.category_id
            WHERE p.id = ?
            """,
            (product_id,),
        ).fetchone()
        imgs = conn.execute(
            "SELECT id, path, is_primary, sort_order FROM product_images "
            "WHERE product_id = ? ORDER BY sort_order, id",
            (product_id,),
        ).fetchall()
    return _build_product(row, imgs, request)


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(product_id: int, _: str = Depends(get_current_admin)):
    with db.get_conn() as conn:
        existing = conn.execute(
            "SELECT id FROM products WHERE id = ?", (product_id,)
        ).fetchone()
        if existing is None:
            raise HTTPException(status_code=404, detail="Product not found")
        conn.execute("DELETE FROM products WHERE id = ?", (product_id,))
