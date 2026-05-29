import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { X, Trash2, ShoppingBag, Minus, Plus } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { formatPrice, getPrimaryImage, cn } from "@/lib/utils";
import ProductImage from "./ProductImage";

export default function CartDrawer({ open, onClose }) {
  const { items, updateQuantity, removeItem, totalPrice, totalItems } =
    useCart();
  const navigate = useNavigate();

  // 鎖定背景捲動 + Esc 關閉
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  const goCheckout = () => {
    onClose();
    navigate("/checkout");
  };

  return (
    <>
      {/* 遮罩 */}
      <div
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-50 bg-foreground/40 transition-opacity duration-300",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      />

      {/* 抽屜 */}
      <aside
        className={cn(
          "fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-background shadow-xl transition-transform duration-300",
          open ? "translate-x-0" : "translate-x-full"
        )}
        role="dialog"
        aria-label="購物車"
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-5">
          <h2 className="text-lg font-semibold">
            購物車{totalItems > 0 && `（${totalItems}）`}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="關閉"
            className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <ShoppingBag className="h-14 w-14 text-wood-light" strokeWidth={1.25} />
            <p className="text-muted-foreground">購物車是空的</p>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-11 items-center justify-center rounded-md border border-wood/40 px-6 text-sm font-medium text-wood transition-colors hover:bg-wood hover:text-primary-foreground"
            >
              繼續購物
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
              {items.map(({ product, quantity }) => (
                <div key={product.id} className="flex gap-4">
                  <ProductImage
                    src={getPrimaryImage(product)}
                    alt={product.name}
                    className="h-20 w-20 shrink-0 rounded-md"
                    iconClassName="h-7 w-7"
                  />
                  <div className="flex flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-medium leading-snug">
                        {product.name}
                      </h3>
                      <button
                        type="button"
                        onClick={() => removeItem(product.id)}
                        aria-label="刪除"
                        className="text-muted-foreground transition-colors hover:text-destructive hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="mt-0.5 text-sm text-wood">
                      {formatPrice(product.price)}
                    </p>
                    <div className="mt-auto flex items-center justify-between pt-2">
                      <div className="inline-flex items-center rounded-md border border-border">
                        <button
                          type="button"
                          aria-label="減少"
                          onClick={() =>
                            updateQuantity(product.id, quantity - 1)
                          }
                          disabled={quantity <= 1}
                          className="flex h-8 w-8 items-center justify-center text-wood transition-colors hover:bg-muted disabled:opacity-40"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-9 text-center text-sm tabular-nums">
                          {quantity}
                        </span>
                        <button
                          type="button"
                          aria-label="增加"
                          onClick={() =>
                            updateQuantity(product.id, quantity + 1)
                          }
                          className="flex h-8 w-8 items-center justify-center text-wood transition-colors hover:bg-muted"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <span className="text-sm font-medium tabular-nums">
                        {formatPrice(product.price * quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-4 border-t border-border px-6 py-5">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">合計</span>
                <span className="text-xl font-semibold text-wood">
                  {formatPrice(totalPrice)}
                </span>
              </div>
              <button
                type="button"
                onClick={goCheckout}
                className="flex h-12 w-full items-center justify-center rounded-md bg-wood text-base font-medium text-primary-foreground transition-colors hover:bg-wood/90"
              >
                前往結帳
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex h-11 w-full items-center justify-center rounded-md text-sm font-medium text-muted-foreground transition-colors hover:text-wood"
              >
                繼續購物
              </button>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
