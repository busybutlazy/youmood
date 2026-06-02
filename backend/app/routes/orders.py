from fastapi import APIRouter, Depends, HTTPException
from fastapi import status as http_status
from pydantic import BaseModel

from app import db
from app.deps import get_current_admin

router = APIRouter(prefix="/api/orders", tags=["orders"])

VALID_STATUSES = {"pending", "confirmed", "shipped", "done", "cancelled"}


class OrderItemIn(BaseModel):
    product_id: int
    quantity: int = 1


class OrderCreate(BaseModel):
    customer_name: str
    customer_phone: str
    customer_email: str | None = None
    customer_address: str | None = None
    notes: str | None = None
    items: list[OrderItemIn]


class StatusUpdate(BaseModel):
    status: str


def _fetch_items(conn, order_id: int) -> list:
    return conn.execute(
        """
        SELECT oi.id, oi.product_id, p.name AS product_name, oi.quantity, oi.unit_price
        FROM order_items oi
        LEFT JOIN products p ON p.id = oi.product_id
        WHERE oi.order_id = ?
        """,
        (order_id,),
    ).fetchall()


def _build_order(order_row, item_rows) -> dict:
    return {
        "id": order_row["id"],
        "customer_name": order_row["customer_name"],
        "customer_phone": order_row["customer_phone"],
        "customer_email": order_row["customer_email"],
        "customer_address": order_row["customer_address"],
        "notes": order_row["notes"],
        "status": order_row["status"],
        "created_at": order_row["created_at"],
        "updated_at": order_row["updated_at"],
        "items": [
            {
                "id": item["id"],
                "product_id": item["product_id"],
                "product_name": item["product_name"],
                "quantity": item["quantity"],
                "unit_price": item["unit_price"],
            }
            for item in item_rows
        ],
    }


@router.post("", status_code=http_status.HTTP_201_CREATED)
def create_order(body: OrderCreate):
    if not body.items:
        raise HTTPException(status_code=400, detail="Order must have at least one item")

    with db.get_conn() as conn:
        # Validate products and snapshot prices in the same transaction
        snapshot: list[tuple] = []
        for item in body.items:
            if item.quantity < 1:
                raise HTTPException(status_code=400, detail="Quantity must be at least 1")
            row = conn.execute(
                "SELECT id, name, price, is_available FROM products WHERE id = ?",
                (item.product_id,),
            ).fetchone()
            if row is None:
                raise HTTPException(status_code=404, detail=f"Product {item.product_id} not found")
            if not row["is_available"]:
                raise HTTPException(
                    status_code=400, detail=f"Product {item.product_id} is not available"
                )
            snapshot.append((item.product_id, row["name"], row["price"], item.quantity))

        cur = conn.execute(
            "INSERT INTO orders (customer_name, customer_phone, customer_email, customer_address, notes) "
            "VALUES (?, ?, ?, ?, ?)",
            (body.customer_name, body.customer_phone, body.customer_email,
             body.customer_address, body.notes),
        )
        order_id = cur.lastrowid

        for product_id, _, unit_price, quantity in snapshot:
            conn.execute(
                "INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)",
                (order_id, product_id, quantity, unit_price),
            )

        order = conn.execute(
            "SELECT id, customer_name, customer_phone, customer_email, customer_address, "
            "notes, status, created_at, updated_at FROM orders WHERE id = ?",
            (order_id,),
        ).fetchone()
        items = _fetch_items(conn, order_id)

    return _build_order(order, items)


@router.get("")
def list_orders(
    status: str | None = None,
    search: str | None = None,
    _: str = Depends(get_current_admin),
):
    if status is not None and status not in VALID_STATUSES:
        raise HTTPException(status_code=400, detail=f"Invalid status: {status}")

    conditions = []
    params: list = []
    if status:
        conditions.append("status = ?")
        params.append(status)
    if search and search.strip():
        term = f"%{search.strip()}%"
        conditions.append("(customer_name LIKE ? OR customer_email LIKE ?)")
        params.extend([term, term])

    where = ("WHERE " + " AND ".join(conditions)) if conditions else ""
    with db.get_conn() as conn:
        orders = conn.execute(
            f"SELECT id, customer_name, customer_phone, customer_email, customer_address, "
            f"notes, status, created_at, updated_at FROM orders {where} ORDER BY id DESC",
            params,
        ).fetchall()
        return [_build_order(o, _fetch_items(conn, o["id"])) for o in orders]


@router.get("/{order_id}")
def get_order(order_id: int, _: str = Depends(get_current_admin)):
    with db.get_conn() as conn:
        order = conn.execute(
            "SELECT id, customer_name, customer_phone, customer_email, customer_address, "
            "notes, status, created_at, updated_at FROM orders WHERE id = ?",
            (order_id,),
        ).fetchone()
        if order is None:
            raise HTTPException(status_code=404, detail="Order not found")
        items = _fetch_items(conn, order_id)
    return _build_order(order, items)


@router.get("/{order_id}/public")
def get_order_public(order_id: int):
    """公開端點：客戶用訂單編號查詢狀態，不回傳個資。"""
    with db.get_conn() as conn:
        order = conn.execute(
            "SELECT id, status, created_at FROM orders WHERE id = ?",
            (order_id,),
        ).fetchone()
        if order is None:
            raise HTTPException(status_code=404, detail="Order not found")
        items = _fetch_items(conn, order_id)
    return {
        "id": order["id"],
        "status": order["status"],
        "created_at": order["created_at"],
        "items": [
            {
                "product_name": it["product_name"],
                "quantity": it["quantity"],
                "unit_price": it["unit_price"],
            }
            for it in items
        ],
    }


@router.patch("/{order_id}/status")
def update_order_status(
    order_id: int,
    body: StatusUpdate,
    _: str = Depends(get_current_admin),
):
    if body.status not in VALID_STATUSES:
        raise HTTPException(status_code=400, detail=f"Invalid status: {body.status}")

    with db.get_conn() as conn:
        if conn.execute("SELECT id FROM orders WHERE id = ?", (order_id,)).fetchone() is None:
            raise HTTPException(status_code=404, detail="Order not found")
        conn.execute(
            "UPDATE orders SET status = ?, updated_at = datetime('now') WHERE id = ?",
            (body.status, order_id),
        )
        order = conn.execute(
            "SELECT id, customer_name, customer_phone, customer_email, customer_address, "
            "notes, status, created_at, updated_at FROM orders WHERE id = ?",
            (order_id,),
        ).fetchone()
        items = _fetch_items(conn, order_id)
    return _build_order(order, items)
