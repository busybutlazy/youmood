// 簡單的 className 合併工具（不引入 clsx / tailwind-merge）
export function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

// 價格格式化：NT$ 1,280
export function formatPrice(value) {
  const n = Number(value) || 0;
  return `NT$ ${n.toLocaleString("zh-Hant-TW")}`;
}

// 從商品的 images 陣列取得主圖（is_primary），無則取第一張
export function getPrimaryImage(product) {
  if (!product || !Array.isArray(product.images) || product.images.length === 0) {
    return null;
  }
  const primary = product.images.find((img) => img.is_primary);
  return (primary || product.images[0]).url || null;
}
