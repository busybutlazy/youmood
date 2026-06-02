import { useState, useEffect } from "react";
import { fetchPageContent, saveText, uploadSiteImage } from "@/api/siteContent";

export function useSiteContent(page, defaults) {
  const [content, setContent] = useState(defaults);

  useEffect(() => {
    fetchPageContent(page)
      .then((data) => {
        const merged = { ...defaults };
        for (const [key, field] of Object.entries(data)) {
          if (field.value !== null) merged[key] = field.value;
        }
        setContent(merged);
      })
      .catch(() => {});
  }, [page]);

  async function updateText(key, value) {
    await saveText(page, key, value);
    setContent((prev) => ({ ...prev, [key]: value }));
  }

  async function updateImage(key, file) {
    const { url } = await uploadSiteImage(page, key, file);
    setContent((prev) => ({ ...prev, [key]: url }));
  }

  return { content, updateText, updateImage };
}
