import { useState } from "react";
import { usePageTitle } from "@/lib/usePageTitle";
import { Search, Loader2, PackageSearch } from "lucide-react";
import { getOrderPublic } from "@/api/orders";
import { formatPrice } from "@/lib/utils";

const STATUS_LABEL = {
  pending: "待確認",
  confirmed: "已確認",
  shipped: "已出貨",
  done: "已完成",
  cancelled: "已取消",
};

const STATUS_COLOR = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  shipped: "bg-purple-100 text-purple-800",
  done: "bg-green-100 text-green-800",
  cancelled: "bg-gray-100 text-gray-500",
};

export default function OrderLookup() {
  usePageTitle("查詢訂單");
  const [input, setInput] = useState("");
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const id = parseInt(input.trim(), 10);
    if (!id || id <= 0) {
      setError("請輸入有效的訂單編號");
      return;
    }
    setLoading(true);
    setError(null);
    setOrder(null);
    try {
      const data = await getOrderPublic(id);
      setOrder(data);
    } catch {
      setError("找不到此訂單，請確認編號是否正確。");
    } finally {
      setLoading(false);
    }
  };

  const total = order
    ? order.items.reduce((s, it) => s + it.unit_price * it.quantity, 0)
    : 0;

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <div className="mb-10 text-center">
        <PackageSearch className="mx-auto mb-4 h-12 w-12 text-wood-light" strokeWidth={1.25} />
        <h1 className="text-3xl font-semibold">查詢訂單狀態</h1>
        <p className="mt-2 text-muted-foreground">
          輸入下單後收到的訂單編號，即可查詢目前進度。
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-3">
        <input
          type="number"
          min="1"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="訂單編號，例如：1"
          className="h-11 flex-1 rounded-md border border-input bg-background px-4 text-sm outline-none transition focus:border-wood focus:ring-2 focus:ring-wood/20"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-wood px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-wood/90 disabled:opacity-60"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
          查詢
        </button>
      </form>

      {error && (
        <p className="mt-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {order && (
        <div className="mt-8 overflow-hidden rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <span className="font-semibold">
              訂單 #{String(order.id).padStart(5, "0")}
            </span>
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_COLOR[order.status] ?? "bg-muted text-muted-foreground"}`}
            >
              {STATUS_LABEL[order.status] ?? order.status}
            </span>
          </div>

          <ul className="divide-y divide-border">
            {order.items.map((it, i) => (
              <li key={i} className="flex items-center justify-between px-6 py-4">
                <div>
                  <p className="text-sm font-medium">{it.product_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatPrice(it.unit_price)} × {it.quantity}
                  </p>
                </div>
                <span className="text-sm font-medium tabular-nums">
                  {formatPrice(it.unit_price * it.quantity)}
                </span>
              </li>
            ))}
          </ul>

          <div className="flex items-center justify-between border-t border-border px-6 py-4">
            <span className="font-medium">總金額</span>
            <span className="text-lg font-semibold text-wood">
              {formatPrice(total)}
            </span>
          </div>

          <p className="border-t border-border px-6 py-3 text-xs text-muted-foreground">
            下單時間：{new Date(order.created_at).toLocaleString("zh-TW")}
          </p>
        </div>
      )}
    </div>
  );
}
