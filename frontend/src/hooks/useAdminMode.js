import { getToken } from "@/api/admin";

// Returns true when an admin JWT is present in localStorage.
// Used on frontend pages to decide whether to render edit controls.
export function useAdminMode() {
  return !!getToken();
}
