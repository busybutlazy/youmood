import { useEffect } from "react";

const SITE = "游木工坊";

export function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} — ${SITE}` : SITE;
    return () => {
      document.title = SITE;
    };
  }, [title]);
}
