import { request } from "./client";

/**
 * POST /api/orders — 建立訂單。
 * @param {{
 *   customer_name: string,
 *   customer_phone: string,
 *   customer_email?: string,
 *   customer_address?: string,
 *   notes?: string,
 *   items: { product_id: number, quantity: number }[]
 * }} payload
 */
export function createOrder(payload) {
  return request("/orders", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getOrderPublic(id) {
  return request(`/orders/${id}/public`);
}
