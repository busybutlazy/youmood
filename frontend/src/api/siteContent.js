import { getToken } from "./admin.js";

export async function fetchPageContent(page) {
  const res = await fetch(`/api/site-content/${page}`);
  if (!res.ok) return {};
  return res.json();
}

export async function saveText(page, key, value) {
  const res = await fetch("/api/admin/site-content", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify({ page, key, value }),
  });
  if (!res.ok) throw new Error("儲存失敗");
  return res.json();
}

export async function uploadSiteImage(page, key, file) {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(
    `/api/admin/site-content/image?page=${encodeURIComponent(page)}&key=${encodeURIComponent(key)}`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${getToken()}` },
      body: form,
    }
  );
  if (!res.ok) throw new Error("上傳失敗");
  return res.json();
}
