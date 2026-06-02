import { Link } from "react-router-dom";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/context/CartContext";
import BrandMark from "./BrandMark";

export default function Navbar({ onCartClick }) {
  const { totalItems } = useCart();

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
        <Link
          to="/"
          className="flex items-center gap-2 text-foreground transition-opacity hover:opacity-80"
        >
          <BrandMark className="h-7 w-7 text-forest" />
          <span className="text-xl font-semibold tracking-wide">游木工坊</span>
        </Link>

        <div className="flex items-center gap-1">
          <Link
            to="/order-lookup"
            className="hidden h-9 items-center rounded-md px-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:flex"
          >
            查詢訂單
          </Link>
          <button
            type="button"
            onClick={onCartClick}
            aria-label="購物車"
            className="relative flex h-11 w-11 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted"
          >
            <ShoppingBag className="h-5 w-5" strokeWidth={1.75} />
            {totalItems > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-wood px-1 text-[11px] font-semibold text-primary-foreground">
                {totalItems > 99 ? "99+" : totalItems}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
