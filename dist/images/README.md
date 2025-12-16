# 圖片資源說明

## 目錄結構

```
public/images/
├── products/
│   ├── wood/          # 木製品圖片
│   └── patchwork/     # 拼布產品圖片
├── hero/              # 首頁輪播圖
└── about/             # 關於頁面圖片
```

## 使用方式

### 方式 1：使用 public 目錄（推薦用於大量圖片）

放在 `public/images/` 下的圖片可以直接通過路徑訪問：

```tsx
// 直接使用路徑（從根目錄開始）
<img src="/images/products/wood/walnut-plate.jpg" alt="胡桃木餐盤" />
```

**優點：**
- 不需要 import
- 適合大量圖片
- 路徑簡單直觀

### 方式 2：使用 src/assets 目錄（適合需要優化的圖片）

放在 `src/assets/images/` 下的圖片需要 import：

```tsx
import walnutPlate from '@/assets/images/walnut-plate.jpg';

<img src={walnutPlate} alt="胡桃木餐盤" />
```

**優點：**
- Vite 會自動優化圖片
- 構建時會檢查文件是否存在
- 適合需要處理的圖片

## 建議

- **產品圖片、大量靜態資源** → 使用 `public/images/`
- **需要優化的小圖片、Logo** → 使用 `src/assets/images/`


