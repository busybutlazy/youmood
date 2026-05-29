import { request } from "./client.js";

const TOKEN_KEY = "youmood_token";

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

function authed(path, options = {}) {
  const { headers, ...rest } = options;
  return request(path, {
    ...rest,
    headers: { Authorization: `Bearer ${getToken()}`, ...headers },
  });
}

// ── Categories ─────────────────────────────────────────────
export const createCategory = (body) =>
  authed("/categories", { method: "POST", body: JSON.stringify(body) });

export const updateCategory = (id, body) =>
  authed(`/categories/${id}`, { method: "PATCH", body: JSON.stringify(body) });

export const deleteCategory = (id) =>
  authed(`/categories/${id}`, { method: "DELETE" });

// ── Products ───────────────────────────────────────────────
export const createProduct = (body) =>
  authed("/products", { method: "POST", body: JSON.stringify(body) });

export const updateProduct = (id, body) =>
  authed(`/products/${id}`, { method: "PATCH", body: JSON.stringify(body) });

export const deleteProduct = (id) =>
  authed(`/products/${id}`, { method: "DELETE" });

// ── Images ─────────────────────────────────────────────────
export const uploadImage = async (productId, file) => {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`/api/products/${productId}/images`, {
    method: "POST",
    headers: { Authorization: `Bearer ${getToken()}` },
    body: form,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.detail || `上傳失敗（${res.status}）`);
  }
  return res.json();
};

export const deleteImage = (productId, imageId) =>
  authed(`/products/${productId}/images/${imageId}`, { method: "DELETE" });

export const setPrimaryImage = (productId, imageId) =>
  authed(`/products/${productId}/images/${imageId}`, {
    method: "PATCH",
    body: JSON.stringify({ is_primary: true }),
  });

// ── Orders ─────────────────────────────────────────────────
export const listOrders = (status) =>
  authed(`/orders${status ? `?status=${status}` : ""}`);

export const updateOrderStatus = (id, status) =>
  authed(`/orders/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
