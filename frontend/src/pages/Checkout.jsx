import { useState } from "react";
import { usePageTitle } from "@/lib/usePageTitle";
import { useNavigate, Link } from "react-router-dom";
import { Loader2, ChevronLeft } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { createOrder } from "@/api/orders";
import { formatPrice, getPrimaryImage } from "@/lib/utils";
import ProductImage from "@/components/ProductImage";

const EMPTY = {
  customer_name: "",
  customer_phone: "",
  customer_email: "",
  customer_address: "",
  notes: "",
};

export default function Checkout() {
  usePageTitle("結帳");
  const { items, totalPrice, clearCart } = useCart();
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    if (items.length === 0) return;
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        customer_name: form.customer_name.trim(),
        customer_phone: form.customer_phone.trim(),
        customer_email: form.customer_email.trim() || undefined,
        customer_address: form.customer_address.trim() || undefined,
        notes: form.notes.trim() || undefined,
        items: items.map((it) => ({
          product_id: it.product.id,
          quantity: it.quantity,
        })),
      };
      const order = await createOrder(payload);
      clearCart();
      navigate(`/order-success/${order.id}`, { state: { order } });
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        <h1 className="text-2xl font-semibold">購物車是空的</h1>
        <p className="mt-3 text-muted-foreground">
          先去挑選喜歡的手作商品吧。
        </p>
        <Link
          to="/products"
          className="mt-6 inline-flex h-11 items-center justify-center rounded-md bg-wood px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-wood/90"
        >
          前往商品列表
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 lg:px-8">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-wood"
      >
        <ChevronLeft className="h-4 w-4" />
        返回
      </button>
      <h1 className="mb-8 text-3xl font-semibold md:text-4xl">結帳</h1>

      <div className="grid gap-10 lg:grid-cols-5">
        {/* 訂單確認 */}
        <div className="lg:col-span-2">
          <h2 className="mb-4 text-lg font-semibold">訂單確認</h2>
          <div className="rounded-lg border border-border bg-card">
            <ul className="divide-y divide-border">
              {items.map(({ product, quantity }) => (
                <li key={product.id} className="flex gap-3 p-4">
                  <ProductImage
                    src={getPrimaryImage(product)}
                    alt={product.name}
                    className="h-16 w-16 shrink-0 rounded-md"
                    iconClassName="h-6 w-6"
                  />
                  <div className="flex flex-1 flex-col justify-center">
                    <p className="text-sm font-medium leading-snug">
                      {product.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatPrice(product.price)} × {quantity}
                    </p>
                  </div>
                  <span className="self-center text-sm font-medium tabular-nums">
                    {formatPrice(product.price * quantity)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="flex items-center justify-between border-t border-border px-4 py-4">
              <span className="font-medium">總金額</span>
              <span className="text-xl font-semibold text-wood">
                {formatPrice(totalPrice)}
              </span>
            </div>
          </div>
        </div>

        {/* 顧客資料表單 */}
        <form onSubmit={onSubmit} className="space-y-5 lg:col-span-3">
          <h2 className="text-lg font-semibold">顧客資料</h2>

          <Field label="姓名" required>
            <input
              type="text"
              required
              value={form.customer_name}
              onChange={set("customer_name")}
              placeholder="王小明"
              className="checkout-input"
            />
          </Field>
          <Field label="電話" required>
            <input
              type="tel"
              required
              value={form.customer_phone}
              onChange={set("customer_phone")}
              placeholder="0912345678"
              className="checkout-input"
            />
          </Field>
          <Field label="Email">
            <input
              type="email"
              value={form.customer_email}
              onChange={set("customer_email")}
              placeholder="user@example.com"
              className="checkout-input"
            />
          </Field>
          <Field label="寄送地址">
            <input
              type="text"
              value={form.customer_address}
              onChange={set("customer_address")}
              placeholder="台北市中正區..."
              className="checkout-input"
            />
          </Field>
          <Field label="備註">
            <textarea
              rows={3}
              value={form.notes}
              onChange={set("notes")}
              placeholder="例如：請小心包裝"
              className="checkout-input resize-none"
            />
          </Field>

          {error && (
            <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-wood text-base font-medium text-primary-foreground transition-colors hover:bg-wood/90 disabled:opacity-60 sm:w-auto sm:px-10"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {submitting ? "送出中..." : "送出訂單"}
          </button>
        </form>
      </div>

      <style>{`
        .checkout-input {
          width: 100%;
          border-radius: var(--radius);
          border: 1px solid hsl(var(--input));
          background: hsl(var(--background));
          padding: 0.7rem 0.9rem;
          font-size: 0.9rem;
          color: hsl(var(--foreground));
          outline: none;
          transition: border-color .2s, box-shadow .2s;
        }
        .checkout-input::placeholder { color: hsl(var(--muted-foreground)); opacity: .7; }
        .checkout-input:focus {
          border-color: hsl(var(--wood));
          box-shadow: 0 0 0 2px hsl(var(--wood) / .15);
        }
      `}</style>
    </div>
  );
}

function Field({ label, required, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-foreground">
        {label}
        {required && <span className="ml-0.5 text-wood">*</span>}
      </span>
      {children}
    </label>
  );
}
