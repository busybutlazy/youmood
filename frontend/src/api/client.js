// 統一的 fetch 封裝。Base path 為相對路徑 /api，由 nginx 反向代理至後端。
const BASE_URL = "/api";

/**
 * 發送 API 請求。非 2xx 時 throw Error，訊息取自回應的 `detail` 欄位。
 * @param {string} path  e.g. "/products?available_only=true"
 * @param {RequestInit} [options]
 */
export async function request(path, options = {}) {
  const { headers, ...rest } = options;
  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      headers: { "Content-Type": "application/json", ...headers },
      ...rest,
    });
  } catch (err) {
    throw new Error("無法連線至伺服器，請稍後再試。");
  }

  if (res.status === 204) return null;

  let data = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!res.ok) {
    const detail =
      (data && data.detail) || `請求失敗（${res.status}）`;
    throw new Error(detail);
  }

  return data;
}

// 將 query 物件轉成字串（略過 undefined / null / 空字串）
export function toQuery(params = {}) {
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    usp.append(key, value);
  });
  const str = usp.toString();
  return str ? `?${str}` : "";
}
