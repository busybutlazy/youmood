# Design Brief — P6 前台商店

給 Claude Design 的完整前端上下文。請依此建立 React JS 前台，不含後台管理介面（後台為 P7）。

---

## 專案背景

**游木工坊（You Wood Workshop）**  
手作木製品與拼布生活美學品牌。品牌精神：以自然為靈感，用雙手創造溫暖。

---

## 技術約束

| 項目 | 規格 |
|---|---|
| 框架 | React（JavaScript，非 TypeScript） |
| 樣式 | Tailwind CSS（現有專案已使用） |
| API | 全走 `/api/*`（nginx 反向代理至後端，不需 CORS 設定） |
| 路由 | React Router；後台統一 `/admin/*`（P6 完全不建後台路由） |
| 狀態管理 | React Context API（購物車）；不引入 Redux / Zustand |
| 購物車持久化 | `localStorage`（刷頁不清空） |
| 圖片 | 由後端提供完整 URL（`/api/images/products/{id}/{filename}`），直接放 `<img src>` |

---

## 品牌設計 Token

現有 CSS variables（直接沿用，不要更改）：

```css
--background: 40 33% 98%;       /* 奶白 cream */
--foreground: 25 20% 20%;       /* 深棕 */
--primary: 25 35% 35%;          /* 木質棕 --wood */
--primary-foreground: 40 33% 98%;
--secondary: 35 30% 90%;        /* 淺米 */
--accent: 140 30% 35%;          /* 森林綠 --forest */
--accent-foreground: 40 33% 98%;
--muted: 35 20% 92%;
--muted-foreground: 25 15% 45%;
--border: 35 20% 85%;
--radius: 0.5rem;

/* 品牌擴充 token */
--wood: 25 35% 35%;
--wood-light: 30 30% 70%;
--forest: 140 30% 35%;
--forest-light: 140 25% 85%;
--cream: 40 33% 98%;
--sage: 120 15% 60%;
```

**字型**：
- 標題：`Noto Serif TC`（serif，已由 Google Fonts 載入）
- 內文：`Zen Maru Gothic`（圓體，已載入）

**視覺風格**：自然、溫暖、手作感。留白充足，避免過度裝飾。按鈕使用 `--wood` 色為主色調，hover 加深。

---

## 前台路由規劃

| 路由 | 頁面 | 說明 |
|---|---|---|
| `/` | 首頁 / 商品目錄 | 商品列表 + 分類篩選，此為主要入口 |
| `/products/:id` | 商品詳情 | 圖片輪播 + 描述 + 加入購物車 |
| `/checkout` | 結帳 | 購物車確認 + 顧客資料表單 |
| `/order-success/:id` | 下單成功 | 顯示訂單編號與摘要 |

---

## 頁面規格

### 首頁（`/`）

**上方 Hero（選用）**：品牌標語「以自然為靈感，用雙手創造溫暖」，簡潔、有質感。

**分類篩選 tabs**：  
- 呼叫 `GET /api/categories`
- 第一個 tab 為「全部」（不帶 `category_id`）
- 點擊 tab 切換商品列表

**商品網格**：  
- 呼叫 `GET /api/products?available_only=true`（帶 `category_id` 時加上篩選）
- 每列 2 欄（行動）/ 3 欄（桌機）
- 每張商品卡包含：主圖（`images` 陣列中 `is_primary: true` 的那張）、商品名稱、價格
- 無主圖時顯示佔位圖（灰色帶木紋 icon 即可）
- 圖片固定 4:3 比例，`object-cover`
- 點擊進入 `/products/:id`

**Loading 狀態**：Skeleton card（灰色漸層）

**空狀態**：「目前尚無商品」文字 + 圖示

---

### 商品詳情（`/products/:id`）

- 呼叫 `GET /api/products/:id`
- 左側：圖片區域
  - 若有多張圖片：大圖 + 縮圖列可點擊切換
  - 若無圖片：顯示佔位圖
- 右側：
  - 商品名稱（serif 大字）
  - 分類標籤（badge，`--forest` 色）
  - 價格（`--wood` 色，大字）
  - 商品描述
  - 數量選擇器（`-` / `+`，最小 1）
  - 「加入購物車」按鈕（`--wood` 主色）
- 加入購物車後顯示 toast / 簡短提示

---

### 購物車

- **實作為抽屜（Drawer）**，從右側滑入，不做獨立頁面
- 觸發：右上角購物車 icon（顯示商品件數 badge）
- 內容：
  - 每筆品項：商品名稱、單價、數量（可調整）、小計、刪除按鈕
  - 合計金額
  - 「前往結帳」按鈕 → 導向 `/checkout`
  - 「繼續購物」按鈕（關閉 drawer）
- 空購物車：提示文字 + 繼續購物按鈕

---

### 結帳（`/checkout`）

分兩欄（桌機）/ 單欄（行動）：

**左側：訂單確認**  
- 購物車品項列表（唯讀）
- 總金額

**右側：顧客資料表單**  
| 欄位 | 必填 | 備註 |
|---|---|---|
| 姓名 | ✓ | |
| 電話 | ✓ | |
| Email | - | |
| 寄送地址 | - | |
| 備註 | - | textarea |

- 送出呼叫 `POST /api/orders`
- 送出中：按鈕 disabled + loading spinner
- 送出失敗：顯示錯誤訊息（API 回的 `detail`）
- 送出成功：清空購物車，導向 `/order-success/:id`

---

### 下單成功（`/order-success/:id`）

- 大大的成功 icon（綠色勾）
- 標題：「感謝您的訂購！」
- 訂單編號
- 品項摘要（從送出時的回傳資料取得，不再呼叫 API）
- 「回到首頁」按鈕

---

## 全站元件

### Navbar

- 左：品牌名稱「游木工坊」（serif，連結回 `/`）
- 右：購物車 icon（附件數 badge）
- 行動版：同樣的 top bar

### 圖片 fallback

無圖商品或圖片載入失敗時，顯示：
```
灰色背景 + 居中木頭 icon（可用 lucide-react 的 TreePine 或 Package）
```

---

## 購物車 State 規格

```js
// CartContext 提供的資料結構
{
  items: [
    {
      product: { id, name, price, images },  // 從 API 取得的完整商品物件
      quantity: 2
    }
  ],
  addItem(product, quantity),
  removeItem(productId),
  updateQuantity(productId, quantity),
  clearCart(),
  totalItems,   // 件數（用於 badge）
  totalPrice    // 合計金額
}
```

購物車資料序列化至 `localStorage`（key: `youmood_cart`），頁面載入時還原。

---

## API 呼叫慣例

- Base URL：相對路徑（`/api/...`），不 hardcode host
- 所有 API 呼叫用 `fetch`（不引入 axios）
- 統一在 `src/api/` 目錄放 API client 函式：
  - `src/api/categories.js`
  - `src/api/products.js`
  - `src/api/orders.js`
- Error handling：非 2xx 時 throw，呼叫端 catch 並 setState

---

## 不在 P6 範圍內

- 後台登入、商品管理、訂單管理（P7）
- `/admin/*` 路由（P7）
- 商品庫存數量管理
- 金流串接
- 訂單追蹤（顧客查詢）
- SEO / SSR

---

## 參考文件

- API 完整規格：`docs/api-contract.md`
- 資料庫 schema：`docs/schema.md`
