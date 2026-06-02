from fastapi import APIRouter, Depends

from app import db
from app.deps import get_current_admin

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.get("/stats")
def get_stats(_: str = Depends(get_current_admin)):
    with db.get_conn() as conn:
        # 本月訂單數與營收（非 cancelled）
        month_row = conn.execute(
            """
            SELECT COUNT(DISTINCT o.id) AS total_orders,
                   COALESCE(SUM(oi.unit_price * oi.quantity), 0) AS revenue
            FROM orders o
            JOIN order_items oi ON oi.order_id = o.id
            WHERE strftime('%Y-%m', o.created_at) = strftime('%Y-%m', 'now')
              AND o.status != 'cancelled'
            """
        ).fetchone()

        # 待確認訂單數
        pending_row = conn.execute(
            "SELECT COUNT(*) AS cnt FROM orders WHERE status = 'pending'"
        ).fetchone()

        # 熱銷商品 TOP5（本月，非 cancelled）
        top_rows = conn.execute(
            """
            SELECT p.name AS product_name,
                   COALESCE(SUM(oi.quantity), 0) AS total_qty
            FROM order_items oi
            JOIN orders o ON o.id = oi.order_id
            LEFT JOIN products p ON p.id = oi.product_id
            WHERE strftime('%Y-%m', o.created_at) = strftime('%Y-%m', 'now')
              AND o.status != 'cancelled'
            GROUP BY oi.product_id
            ORDER BY total_qty DESC
            LIMIT 5
            """
        ).fetchall()

    return {
        "total_orders": month_row["total_orders"],
        "revenue": month_row["revenue"],
        "pending_count": pending_row["cnt"],
        "top_products": [
            {"product_name": r["product_name"], "total_qty": r["total_qty"]}
            for r in top_rows
        ],
    }
