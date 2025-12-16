# 使用本地圖片的範例

## 範例 1：在 Products.tsx 中使用 public 目錄的圖片

```tsx
const allProducts = [
  {
    id: '1',
    name: '胡桃木餐盤',
    price: 1280,
    category: 'wood',
    // 使用 public 目錄的圖片（從根路徑開始）
    image: '/images/products/wood/walnut-plate.jpg',
    description: '手工打磨，保留原木紋理',
  },
  {
    id: '2',
    name: '森林拼布束口袋',
    price: 680,
    category: 'patchwork',
    image: '/images/products/patchwork/forest-bag.jpg',
    description: '日系布料拼接設計',
  },
];
```

## 範例 2：在組件中使用 src/assets 目錄的圖片

```tsx
import logoImage from '@/assets/images/logo.png';

function Header() {
  return (
    <img src={logoImage} alt="Logo" />
  );
}
```

## 範例 3：在 HeroCarousel 中使用本地圖片

```tsx
const slides = [
  {
    id: 1,
    title: '手作木器',
    image: '/images/hero/wood-craft.jpg',  // public 目錄
    link: '/products?category=wood',
  },
];
```

## 圖片命名建議

- 使用小寫字母和連字號：`walnut-plate.jpg`
- 避免空格和特殊字符
- 保持檔名有意義且易於識別


