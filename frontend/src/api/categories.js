import { request } from "./client";

// GET /api/categories — 列出所有分類（依 sort_order）
export function getCategories() {
  return request("/categories");
}
