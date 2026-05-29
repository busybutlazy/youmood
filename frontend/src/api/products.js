import { request, toQuery } from "./client";

/**
 * GET /api/products — 列出商品。
 * @param {{ categoryId?: number, availableOnly?: boolean }} [opts]
 */
export function getProducts({ categoryId, availableOnly = true } = {}) {
  const query = toQuery({
    category_id: categoryId,
    available_only: availableOnly ? "true" : undefined,
  });
  return request(`/products${query}`);
}

// GET /api/products/:id — 取單一商品（含圖片列表）
export function getProduct(id) {
  return request(`/products/${id}`);
}
