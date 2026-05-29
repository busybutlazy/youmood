# 游木工坊 — P6 前台商店

以 React + Vite + Tailwind CSS 重建的前台原始碼（JavaScript，非 TypeScript）。

## 開發

```bash
cd frontend
npm install
npm run dev      # http://localhost:5173
```

開發伺服器會將 `/api/*` 反向代理至 `http://localhost:8000`（見 `vite.config.js`，可依後端位址調整）。

## 建置

```bash
npm run build    # 產出 dist/
npm run preview  # 預覽建置結果
```

正式環境由 nginx 反向代理 `/api/*` 至後端，前端為靜態檔。

## 目錄結構

```
src/
├── main.jsx              進入點（BrowserRouter）
├── App.jsx              路由表
├── index.css           設計 token（CSS variables）+ Tailwind
├── api/                /api/* client（fetch 封裝，無 axios）
│   ├── client.js
│   ├── categories.js
│   ├── products.js
│   └── orders.js
├── context/
│   ├── CartContext.jsx  購物車狀態 + localStorage 持久化（key: youmood_cart）
│   └── ToastContext.jsx 輕量 toast
├── components/         共用元件（Navbar / Footer / CartDrawer / ProductCard …）
├── data/marketing.js   行銷頁靜態文案（Hero / 特色 / 關於 / 聯絡）
└── pages/              Home / Products / ProductDetail / About / Contact /
                        Checkout / OrderSuccess / NotFound
```

## 路由

| 路由 | 頁面 |
|---|---|
| `/` | 行銷首頁（Hero 輪播 + 精選商品 + 品牌介紹 + 特色） |
| `/products` | 商品目錄（分類 tabs + 商品網格） |
| `/products/:id` | 商品詳情 |
| `/about` | 關於我們 |
| `/contact` | 聯絡我們 |
| `/checkout` | 結帳 |
| `/order-success/:id` | 下單成功 |

## 設計 token

全部定義於 `src/index.css` 的 `:root`，並由 `tailwind.config.js` 對應為 Tailwind 色彩（`bg-wood`、`text-forest`、`bg-cream` 等）。字型：標題 `Noto Serif TC`、內文 `Zen Maru Gothic`。

## 注意

- 購物車為右側滑入抽屜（非獨立頁），由 Navbar 購物車 icon 觸發。
- 商品資料全部來自 `/api`，含 loading skeleton 與空狀態。
- 聯絡表單為純前端（無對應 API），送出為模擬行為。
