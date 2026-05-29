# API Contract — 游木工坊

v0.1.0 — 2026-05-29

## 基本規則

- Base path: `/api`
- Content-Type: `application/json`（圖片上傳用 `multipart/form-data`）
- Auth: `Authorization: Bearer <JWT>`（僅後台端點需要）
- 圖片存取路徑: `GET /api/images/{path}`

## Error 格式

```json
{ "detail": "<訊息>" }
```

| HTTP 碼 | 情境 |
|---|---|
| 400 | 參數錯誤 |
| 401 | 未登入 / token 過期 |
| 403 | 權限不足 |
| 404 | 資源不存在 |
| 422 | 型別驗證失敗（FastAPI 自動） |

---

## Endpoints

### System

| Method | Path | Auth | 說明 |
|---|---|---|---|
| GET | `/api/health` | - | 健康檢查 |

### Auth

| Method | Path | Auth | 說明 |
|---|---|---|---|
| POST | `/api/auth/login` | - | 帳密換 JWT |

**POST /api/auth/login** request:
```json
{ "username": "admin", "password": "..." }
```
response:
```json
{ "access_token": "...", "token_type": "bearer" }
```

---

### Categories

| Method | Path | Auth | 說明 |
|---|---|---|---|
| GET | `/api/categories` | - | 列出所有分類（依 sort_order） |
| POST | `/api/categories` | 管理員 | 新增分類 |
| PATCH | `/api/categories/{id}` | 管理員 | 更新名稱或排序 |
| DELETE | `/api/categories/{id}` | 管理員 | 刪除分類（products.category_id SET NULL） |

**GET /api/categories** response:
```json
[
  { "id": 1, "name": "木製品", "sort_order": 0 },
  { "id": 2, "name": "拼布", "sort_order": 1 }
]
```

**POST /api/categories** request / response（單筆）:
```json
{ "name": "木製品", "sort_order": 0 }
```
```json
{ "id": 1, "name": "木製品", "sort_order": 0 }
```

---

### Products

| Method | Path | Auth | 說明 |
|---|---|---|---|
| GET | `/api/products` | - | 列出商品（query: `category_id`, `available_only=true`） |
| GET | `/api/products/{id}` | - | 取單一商品（含圖片列表） |
| POST | `/api/products` | 管理員 | 新增商品 |
| PATCH | `/api/products/{id}` | 管理員 | 更新商品資訊 |
| DELETE | `/api/products/{id}` | 管理員 | 刪除商品（CASCADE 刪除圖片） |

**GET /api/products** response item shape:
```json
{
  "id": 1,
  "name": "胡桃木餐盤",
  "description": "...",
  "price": 1280.0,
  "category_id": 1,
  "category_name": "木製品",
  "is_available": true,
  "images": [
    { "id": 1, "url": "http://host/api/images/products/1/main.jpg", "is_primary": true, "sort_order": 0 }
  ],
  "created_at": "2026-05-29T00:00:00"
}
```

---

**GET /api/products/{id}** response（同 GET /api/products 單項，多一層確認存在）

---

### Product Images

| Method | Path | Auth | 說明 |
|---|---|---|---|
| POST | `/api/products/{id}/images` | 管理員 | 上傳圖片（`multipart/form-data`，欄位 `file`） |
| DELETE | `/api/products/{id}/images/{image_id}` | 管理員 | 刪除圖片（同時刪 volume 檔案） |
| PATCH | `/api/products/{id}/images/{image_id}` | 管理員 | 更新 is_primary 或 sort_order |
| GET | `/api/images/{path:path}` | - | 取圖片檔案（由 backend 讀 volume 回傳） |

---

### Orders

| Method | Path | Auth | 說明 |
|---|---|---|---|
| POST | `/api/orders` | - | 客戶建立訂單 |
| GET | `/api/orders` | 管理員 | 列出訂單（query: `status`） |
| GET | `/api/orders/{id}` | 管理員 | 取單一訂單（含 items） |
| PATCH | `/api/orders/{id}/status` | 管理員 | 更新訂單狀態 |

**POST /api/orders** request:
```json
{
  "customer_name": "王小明",
  "customer_phone": "0912345678",
  "customer_email": "user@example.com",
  "customer_address": "台北市...",
  "notes": "...",
  "items": [
    { "product_id": 1, "quantity": 2 }
  ]
}
```

**POST /api/orders / GET /api/orders/{id}** response:
```json
{
  "id": 1,
  "customer_name": "王小明",
  "customer_phone": "0912345678",
  "customer_email": "user@example.com",
  "customer_address": "台北市中正區",
  "notes": "請小心包裝",
  "status": "pending",
  "created_at": "2026-05-29T00:00:00",
  "updated_at": "2026-05-29T00:00:00",
  "items": [
    {
      "id": 1,
      "product_id": 1,
      "product_name": "胡桃木餐盤",
      "quantity": 2,
      "unit_price": 1280.0
    }
  ]
}
```

訂單狀態值：`pending` | `confirmed` | `shipped` | `done` | `cancelled`

**GET /api/orders** response：同上格式的陣列，依 id 降冪排列。

**PATCH /api/orders/{id}/status** request:
```json
{ "status": "confirmed" }
```

response：更新後的完整訂單物件（同 GET /api/orders/{id}）。

---

## 修訂規則

- **bump minor**（v0.1 → v0.2）：新增 endpoint、新增非必填欄位
- **bump major**（v0 → v1）：移除 endpoint、更改必填欄位、破壞性 schema 變更
- 任何 bump 須同步更新此檔案版本號與 `roadmap.md` ADR ledger
