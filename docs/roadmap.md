# Roadmap — 游木工坊

## 開發紀律

- 每個 phase 開一條對應 branch，命名規則：`phase/P{N}-{slug}`（例如 `phase/P2-auth`）
- Phase 完成（完成判準全部達成）後開 PR → 由 owner merge 到 `main`，**不自行 merge**
- PR 描述需列出該 phase 的完成判準檢查清單

## Phase 依賴圖

```
BE 軸:  P0 ── P1 ── P2 ── P3 ── P4 ── P5
                                        ↓ 匯流點
FE 軸:                              P6-FE ── P7-FE
```

---

## P0: docker-infra ✅

### 目標
建立全 Docker 開發環境骨架，確立前後端服務分離。

### 對應需求 / 前置 phase
- 設計原則：測試跑在 Docker 裡，host 不裝套件
- 前置：無

### 範圍
- repo root: `docker-compose.yml`、`docker-compose.test.yml`、`.env.example`
- `backend/`: Dockerfile、FastAPI 骨架（health endpoint）、pytest 設定
- `frontend/`: Dockerfile（nginx）、nginx proxy 設定

### 完成判準
- `docker compose up` 後，`curl localhost:3000/api/health` 回 `{"ok": true}`
- `docker compose -f docker-compose.test.yml up --exit-code-from test-backend` 全綠

### 規模
S（已完成 2026-05-29）

---

## P1: db-schema

### 目標
建立 SQLite schema 初始化機制，確保 backend 啟動時 DB 與目錄結構就緒。

### 對應需求 / 前置 phase
- 需求：所有 API 的基礎
- 前置：P0

### 範圍
- `backend/app/db.py`：SQLite 連線 + schema init（建表 + 建目錄）
- pytest：驗證 DB 可連、六張表均存在

### 完成判準
- Backend 啟動後 `/data/db/youmood.db` 存在，六張表（categories、products、product_images、admin_users、orders、order_items）均建立
- `/data/images/products/` 目錄存在
- pytest 全綠

### 風險
- Docker volume 首次掛載時目錄不存在 → init 時補建
  - Mitigation: db.py 啟動時 `mkdir -p` 確保路徑

### 規模
S（樂觀 1 天 / 現實 1 天）

---

## P2: auth

### 目標
實作後台 JWT 登入，建立認證中介層供後續 phase 使用。

### 對應需求 / 前置 phase
- 需求：後台帳密登入
- 前置：P1

### 範圍
- `backend/app/routes/auth.py`：`POST /api/auth/login`
- `backend/app/deps.py`：`get_current_admin` dependency（JWT 驗證）
- admin seed script（首次建立預設帳號）
- pytest：登入成功/失敗、token 驗證

### 完成判準
- `POST /api/auth/login` 正確帳密 → 回傳 JWT
- `POST /api/auth/login` 錯誤帳密 → 401
- 受保護端點帶 token → 200；不帶 → 401
- pytest 全綠

### 風險
- SECRET_KEY 未設定時 JWT 簽名不安全
  - Mitigation: startup 時若 SECRET_KEY 為預設值且非 dev 環境 → warning log

### 規模
S（樂觀 1 天 / 現實 2 天）

---

## P3: categories-products-crud

### 目標
實作分類與商品的 CRUD API（不含圖片）。

### 對應需求 / 前置 phase
- 需求：分類管理、商品 CRUD
- 前置：P2（需要 auth dependency）

### 範圍
- `backend/app/routes/categories.py`：GET / POST / PATCH / DELETE
- `backend/app/routes/products.py`：GET list / GET one / POST / PATCH / DELETE
- pytest：CRUD 各操作 + auth 保護驗證

### 完成判準
- 可建立分類並取得列表
- 可建立商品（含 category_id）並取得含 category_name 的列表
- 未登入呼叫寫入端點 → 401
- pytest 全綠

### 風險
- 刪除分類時 products.category_id SET NULL 行為需驗證
  - Mitigation: 明確寫 test case 驗證此行為

### 規模
S（樂觀 2 天 / 現實 3 天）

---

## P4: image-upload

### 目標
實作商品圖片上傳、刪除與存取 API。

### 對應需求 / 前置 phase
- 需求：圖片上傳（存 volume，DB 存路徑）
- 前置：P3（需要 product 存在）

### 範圍
- `backend/app/routes/images.py`：POST upload / DELETE / PATCH（排序/主圖）/ GET 檔案
- 圖片存 `/data/images/products/{product_id}/{filename}`
- pytest：上傳 → volume 有檔案、DB 有記錄；刪除 → 兩者同步清除

### 完成判準
- `POST /api/products/{id}/images` 上傳圖片後，`GET /api/products/{id}` 回傳含完整圖片 URL
- `GET /api/images/{path}` 可取到圖片檔案
- 刪除圖片後 volume 檔案同步刪除
- pytest 全綠

### 風險
- 圖片 URL 組裝依賴 Request host，本機 vs 生產環境不同
  - Mitigation: BE 用 `Request.base_url` 動態組裝，不 hardcode host

### 規模
S（樂觀 2 天 / 現實 2 天）

---

## P5: orders

### 目標
實作訂單建立與管理 API。

### 對應需求 / 前置 phase
- 需求：客戶下單、後台訂單管理
- 前置：P3（需要 product 存在）

### 範圍
- `backend/app/routes/orders.py`：POST / GET list / GET one / PATCH status
- pytest：建立訂單 + 狀態更新 + unit_price 快照驗證

### 完成判準
- `POST /api/orders` 建立訂單（含 items），unit_price 快照商品當時售價
- `PATCH /api/orders/{id}/status` 更新狀態
- 修改商品售價後，既有訂單 unit_price 不變（pytest 驗證）
- pytest 全綠

### 風險
- unit_price 快照若在 route 層漏做，會靜默錯誤
  - Mitigation: 強制 test case 驗證「改價後舊訂單不變」

### 規模
S（樂觀 2 天 / 現實 3 天）

---

## P6: frontend-store

### 目標
前台商品瀏覽 + 購物車 + 下單流程。

### 對應需求 / 前置 phase
- 需求：商品目錄、購物車、下單表單
- 前置：P3 + P4 + P5（所有 API 穩定）

### 範圍
- `frontend/src/`：商品目錄、分類 tab 篩選、商品詳情、購物車（context）、下單表單

### 完成判準
- 能走完「瀏覽商品 → 加入購物車 → 填資料 → 送出訂單」完整流程
- 訂單寫入 DB，後台可查到

### 風險
- 前台與後台共用 SPA，路由需在此 phase 定義清楚
  - Mitigation: 後台路徑統一 `/admin/*`，此 phase 只建前台路由

### 規模
M（樂觀 5 天 / 現實 7 天）

---

## P7: frontend-admin

### 目標
後台管理 UI：商品管理、圖片上傳、訂單管理。

### 對應需求 / 前置 phase
- 需求：後台登入、商品管理、訂單管理
- 前置：P6

### 範圍
- `frontend/src/admin/`：登入頁、分類管理、商品 CRUD + 圖片上傳、訂單列表 + 狀態更新
- 路由保護（未登入 → 導向 `/admin/login`）
- JWT 存 localStorage

### 完成判準
- 登入後能新增商品並上傳圖片，前台立即可見
- 能在後台更新訂單狀態
- 重新整理後登入狀態保持

### 風險
- 多圖排序 UX 複雜度高
  - Mitigation: 先做單圖上傳，多圖排序列為 P7b nice-to-have

### 規模
M（樂觀 5 天 / 現實 7 天）

---

## P9: frontend-ux

### 目標
補完前台購物體驗的缺口，降低使用者流失。

### 對應需求 / 前置 phase
- 需求：完整的前台使用者旅程
- 前置：P6（前台基礎功能已完成）

### 範圍
- 商品關鍵字搜尋（前台商品列表可用關鍵字過濾）
- 訂單狀態查詢頁（`/orders/{id}`，客戶填訂單編號查進度）
- 空狀態畫面（購物車空、搜尋無結果、商品列表空）
- 商品無庫存（`stock` 欄位為 0 時）顯示「已售完」並禁止加入購物車
- 下單成功頁（`/order-success`，顯示訂單編號與預估出貨說明）

### 完成判準
- 前台輸入關鍵字能即時篩選商品
- 客戶可用訂單編號查到自己的訂單狀態
- 購物車為空時有引導文案與 CTA
- 下單後導向成功頁，顯示訂單編號

### 規模
M（樂觀 3 天 / 現實 5 天）

---

## P10: admin-enhancement

### 目標
強化後台管理能力，讓店主日常營運更有效率。

### 對應需求 / 前置 phase
- 需求：後台可視化營運狀況、商品庫存管理
- 前置：P7（後台基礎功能已完成）

### 範圍
- 儀表板首頁（本月訂單數、營收、待處理訂單數、熱銷商品 TOP5）
- 商品新增/編輯加入 `stock`（庫存數量）欄位
- 訂單列表可依狀態篩選 + 關鍵字搜尋（客戶姓名 / email）
- 後台路由更新：`/admin` index 導向 `/admin/dashboard`

### 完成判準
- 進入後台首頁可看到當月營收與待處理訂單數
- 可對商品設定庫存數量，前台自動反映「已售完」
- 訂單列表可用狀態 tab 篩選

### 風險
- `stock` 欄位需 DB migration（新增 column with default）
  - Mitigation: `ALTER TABLE products ADD COLUMN stock INTEGER NOT NULL DEFAULT 0`，加 pytest 驗證

### 規模
M（樂觀 3 天 / 現實 5 天）

---

## P11: seo-meta

### 目標
改善搜尋引擎能見度與社群分享預覽。

### 對應需求 / 前置 phase
- 需求：Google 搜尋排名、LINE / IG 分享時有圖卡
- 前置：P9（前台路由穩定後再做）

### 範圍
- `index.html` 補全 `<meta>` 基礎標籤（description、keywords）
- Open Graph tags（`og:title`、`og:description`、`og:image`、`og:url`）
- Twitter Card tags
- 商品頁動態 meta（`react-helmet-async` 或手動操作 document.title）
- `public/sitemap.xml`（靜態，列出主要路由）
- `public/robots.txt`

### 完成判準
- [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/) 顯示正確圖卡
- `curl https://www.youmood.shop` 回傳的 HTML 含 og:image
- robots.txt 可正常存取

### 風險
- SPA 的 og tags 需在 SSR 或 nginx 層處理才能被爬蟲讀到
  - Mitigation: 靜態首頁與關於頁寫死在 `index.html`；商品頁 og 先跳過（爬蟲讀不到動態插入的 meta）

### 規模
S（樂觀 1 天 / 現實 2 天）

---

## P12: production-hardening

### 目標
讓生產環境更穩定、可觀察、易維護。

### 對應需求 / 前置 phase
- 需求：服務不因意外重啟而丟資料，問題發生時能快速診斷
- 前置：P8（安全基礎已完成）

### 範圍
- Docker Compose `healthcheck`（backend + frontend）
- `restart: unless-stopped` 已存在；補 `deploy.resources.limits` 防 OOM
- SQLite WAL 模式開啟（`PRAGMA journal_mode=WAL`）
- 自動備份腳本（`/data/db/youmood.db` 每日 cron 備份到 `/data/backups/`，保留 7 天）
- Nginx access log 導向 stdout（Docker logs 可查）
- `.env.example` 補齊所有可配置項目說明

### 完成判準
- `docker compose ps` 顯示 backend / frontend health: healthy
- `docker exec` 可確認 WAL 模式已開啟
- 備份腳本手動執行後 `/data/backups/` 有 `.db` 備份檔

### 風險
- WAL 模式在 container 重啟後是否保持？
  - Mitigation: WAL 設定存在 DB 檔案本身，重啟不會重置；加 pytest 驗證啟動後 journal_mode 值

### 規模
S（樂觀 2 天 / 現實 2 天）

---

## Timeline

| 樂觀 | 現實 |
|---|---|
| 3–4 週 | 5–6 週 |

---

## 已決議事項（ADR Ledger）

| ID | 議題 | 決議 + 為什麼 | 放棄方案 |
|---|---|---|---|
| ADR-001 | DB 選型 | **SQLite 先行**。單一服務、無多程序並發寫入需求，部署與備份最簡單。 | PostgreSQL — 超出目前規模需求，增加 infra 複雜度 |
| ADR-002 | Admin auth 機制 | **JWT（帳密換 token）**。SPA stateless，FE 存 token 即可，不需 server-side session store。 | Session cookie — 需 Redis 或 server-side session 管理 |
| ADR-003 | 圖片儲存 | **Docker volume + DB 只存相對路徑**。避免 blob 存 DB 的效能問題，volume 遷移到 S3 時只需換 path prefix。 | DB blob — 效能差；S3 — 架構過重，目前不需要 |
| ADR-004 | 商品分類 | **categories 表（動態新增）**。讓店主自由管理分類，不鎖死在程式碼裡。 | Hardcode enum — 無法在後台增刪分類 |
| ADR-005 | 前台/後台路由 | **同一個 React SPA，後台路徑統一 `/admin/*`**。減少 container 數量，共用 API client 與型別定義。 | 獨立 admin React app — 多一個 container，部署更複雜 |
| ADR-006 | Phase 粒度 | **BE 每個關注點獨立一個 phase**（schema / auth / CRUD / image / orders）。PR 範圍小，review 清楚。 | 大 phase 合併（backend-core）— PR 太大，難以 review |
