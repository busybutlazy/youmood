import { Link } from "react-router-dom";
import { Settings } from "lucide-react";
import { useAdminMode } from "@/hooks/useAdminMode";

export default function AdminBar() {
  const isAdmin = useAdminMode();
  if (!isAdmin) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Link
        to="/admin/dashboard"
        className="flex items-center gap-2 rounded-full bg-wood px-4 py-2.5 text-sm font-medium text-white shadow-lg transition-colors hover:bg-wood/90"
      >
        <Settings className="h-4 w-4" />
        返回後台
      </Link>
    </div>
  );
}
