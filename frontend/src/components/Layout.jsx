import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useEffect } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import CartDrawer from "./CartDrawer";

export default function Layout() {
  const [cartOpen, setCartOpen] = useState(false);
  const { pathname } = useLocation();

  // 換頁時捲回頂端
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar onCartClick={() => setCartOpen(true)} />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  );
}
