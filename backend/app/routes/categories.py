from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app import db
from app.deps import get_current_admin

router = APIRouter(prefix="/api/categories", tags=["categories"])


class CategoryCreate(BaseModel):
    name: str
    sort_order: int = 0


class CategoryUpdate(BaseModel):
    name: str | None = None
    sort_order: int | None = None


@router.get("")
def list_categories():
    with db.get_conn() as conn:
        rows = conn.execute(
            "SELECT id, name, sort_order FROM categories ORDER BY sort_order, id"
        ).fetchall()
    return [dict(r) for r in rows]


@router.post("", status_code=status.HTTP_201_CREATED)
def create_category(body: CategoryCreate, _: str = Depends(get_current_admin)):
    with db.get_conn() as conn:
        try:
            cur = conn.execute(
                "INSERT INTO categories (name, sort_order) VALUES (?, ?)",
                (body.name, body.sort_order),
            )
            row = conn.execute(
                "SELECT id, name, sort_order FROM categories WHERE id = ?",
                (cur.lastrowid,),
            ).fetchone()
        except Exception as e:
            if "UNIQUE" in str(e):
                raise HTTPException(status_code=400, detail="Category name already exists")
            raise
    return dict(row)


@router.patch("/{category_id}")
def update_category(
    category_id: int,
    body: CategoryUpdate,
    _: str = Depends(get_current_admin),
):
    with db.get_conn() as conn:
        existing = conn.execute(
            "SELECT id FROM categories WHERE id = ?", (category_id,)
        ).fetchone()
        if existing is None:
            raise HTTPException(status_code=404, detail="Category not found")

        if body.name is not None:
            conn.execute(
                "UPDATE categories SET name = ? WHERE id = ?", (body.name, category_id)
            )
        if body.sort_order is not None:
            conn.execute(
                "UPDATE categories SET sort_order = ? WHERE id = ?",
                (body.sort_order, category_id),
            )
        row = conn.execute(
            "SELECT id, name, sort_order FROM categories WHERE id = ?", (category_id,)
        ).fetchone()
    return dict(row)


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(category_id: int, _: str = Depends(get_current_admin)):
    with db.get_conn() as conn:
        existing = conn.execute(
            "SELECT id FROM categories WHERE id = ?", (category_id,)
        ).fetchone()
        if existing is None:
            raise HTTPException(status_code=404, detail="Category not found")
        conn.execute("DELETE FROM categories WHERE id = ?", (category_id,))
