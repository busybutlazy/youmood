import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { LayoutGrid, Tag, ShoppingBag, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

const NAV = [
  { to: "/admin/products", icon: LayoutGrid, label: "商品管理" },
  { to: "/admin/categories", icon: Tag, label: "分類管理" },
  { to: "/admin/orders", icon: ShoppingBag, label: "訂單管理" },
];

export default function AdminLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/admin/login");
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="flex w-56 flex-col border-r border-border bg-card">
        <div className="px-6 py-5 border-b border-border">
          <span className="font-serif text-lg text-primary">游木工坊</span>
          <p className="text-xs text-muted-foreground mt-0.5">後台管理</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-muted"
                }`
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-6 py-4 text-sm text-muted-foreground hover:text-foreground border-t border-border transition-colors"
        >
          <LogOut size={16} />
          登出
        </button>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto p-8">
        <Outlet />
      </main>
    </div>
  );
}
