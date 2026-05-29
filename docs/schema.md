# DB Schema — 游木工坊

SQLite。檔案路徑：`/data/db/youmood.db`（Docker volume mount）。

## DDL

```sql
CREATE TABLE categories (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT    NOT NULL UNIQUE,
    sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE products (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    name         TEXT    NOT NULL,
    description  TEXT,
    price        REAL    NOT NULL,
    category_id  INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    is_available INTEGER NOT NULL DEFAULT 1,
    created_at   TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at   TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE product_images (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    path       TEXT    NOT NULL,   -- 相對路徑，e.g. products/1/main.jpg
    is_primary INTEGER NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE admin_users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    username      TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,   -- bcrypt hash
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE orders (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_name    TEXT NOT NULL,
    customer_phone   TEXT NOT NULL,
    customer_email   TEXT,
    customer_address TEXT,
    notes            TEXT,
    status           TEXT NOT NULL DEFAULT 'pending',
    created_at       TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at       TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE order_items (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id   INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id),
    quantity   INTEGER NOT NULL DEFAULT 1,
    unit_price REAL    NOT NULL   -- 下單當時的商品售價快照
);
```

## 訂單狀態機

```
pending → confirmed → shipped → done
       ↘ cancelled
```

| 狀態 | 說明 |
|---|---|
| `pending` | 客戶已送出，待店主確認 |
| `confirmed` | 店主確認接單 |
| `shipped` | 已出貨 |
| `done` | 完成 |
| `cancelled` | 取消（可從任何狀態取消） |

## Volume 目錄結構

```
/data/
├── db/
│   └── youmood.db
└── images/
    └── products/
        └── {product_id}/
            └── {filename}
```

`product_images.path` 存 `products/{product_id}/{filename}`，BE 組裝時加上 base URL。

## 未來 migration 計畫

| Phase | 預計變更 |
|---|---|
| P1 | 建立全部表（categories / products / product_images / admin_users / orders / order_items） |
| P2 以後 | 目前無預定 ALTER |
| SQLite → PostgreSQL（未定） | 僅 DDL 語法微調，schema 設計已相容 |
