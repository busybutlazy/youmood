import { useState, useEffect, useCallback } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { listOrders, updateOrderStatus } from "../../api/admin.js";

const STATUSES = [
  { value: "", label: "全部" },
  { value: "pending", label: "待確認" },
  { value: "confirmed", label: "已確認" },
  { value: "shipped", label: "已出貨" },
  { value: "done", label: "完成" },
  { value: "cancelled", label: "已取消" },
];

const STATUS_LABEL = Object.fromEntries(STATUSES.slice(1).map((s) => [s.value, s.label]));

const STATUS_COLORS = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  shipped: "bg-purple-100 text-purple-800",
  done: "bg-forest-light text-forest",
  cancelled: "bg-muted text-muted-foreground",
};

const NEXT_STATUSES = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["shipped", "cancelled"],
  shipped: ["done", "cancelled"],
  done: [],
  cancelled: [],
};

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setOrders(await listOrders(filter));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  async function handleStatusChange(orderId, newStatus) {
    try {
      const updated = await updateOrderStatus(orderId, newStatus);
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
    } catch (err) {
      setError(err.message);
    }
  }

  const totalFor = (order) =>
    order.items.reduce((sum, i) => sum + i.unit_price * i.quantity, 0);

  return (
    <div>
      <h1 className="font-serif text-2xl text-primary mb-6">訂單管理</h1>

      {error && (
        <div className="mb-4 rounded-md bg-destructive/10 text-destructive px-4 py-2 text-sm">
          {error}
        </div>
      )}

      {/* Status filter tabs */}
      <div className="flex gap-1 mb-6 flex-wrap">
        {STATUSES.map((s) => (
          <button
            key={s.value}
            onClick={() => setFilter(s.value)}
            className={`rounded-full px-3 py-1 text-sm transition-colors ${
              filter === s.value
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-secondary"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {loading && <p className="text-muted-foreground">載入中…</p>}

      {!loading && orders.length === 0 && (
        <p className="text-muted-foreground py-12 text-center">無訂單資料</p>
      )}

      <div className="space-y-3">
        {orders.map((order) => (
          <div key={order.id} className="rounded-xl border border-border bg-card overflow-hidden">
            {/* Order header */}
            <div className="flex items-center gap-4 px-5 py-4">
              <span className="text-xs text-muted-foreground w-16">#{order.id}</span>

              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{order.customer_name}</p>
                <p className="text-xs text-muted-foreground">{order.customer_phone}</p>
              </div>

              <p className="text-sm font-medium whitespace-nowrap">
                NT$ {totalFor(order).toLocaleString()}
              </p>

              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[order.status]}`}>
                {STATUS_LABEL[order.status] ?? order.status}
              </span>

              {/* Status action buttons */}
              {NEXT_STATUSES[order.status]?.length > 0 && (
                <div className="flex gap-2">
                  {NEXT_STATUSES[order.status].map((s) => (
                    <button
                      key={s}
                      onClick={() => handleStatusChange(order.id, s)}
                      className={`rounded-md px-2.5 py-1 text-xs transition-colors ${
                        s === "cancelled"
                          ? "border border-border text-muted-foreground hover:border-destructive hover:text-destructive"
                          : "bg-primary text-primary-foreground hover:opacity-90"
                      }`}
                    >
                      {STATUS_LABEL[s]}
                    </button>
                  ))}
                </div>
              )}

              <button
                onClick={() => setExpanded(expanded === order.id ? null : order.id)}
                className="text-muted-foreground hover:text-foreground ml-1"
              >
                {expanded === order.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            </div>

            {/* Expanded detail */}
            {expanded === order.id && (
              <div className="border-t border-border bg-muted/30 px-5 py-4 text-sm space-y-3">
                <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-xs">
                  {order.customer_email && (
                    <p><span className="text-muted-foreground">Email：</span>{order.customer_email}</p>
                  )}
                  {order.customer_address && (
                    <p><span className="text-muted-foreground">地址：</span>{order.customer_address}</p>
                  )}
                  {order.notes && (
                    <p className="col-span-2"><span className="text-muted-foreground">備註：</span>{order.notes}</p>
                  )}
                  <p><span className="text-muted-foreground">建立：</span>{order.created_at.replace("T", " ").slice(0, 16)}</p>
                </div>

                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-muted-foreground border-b border-border">
                      <th className="text-left pb-1">商品</th>
                      <th className="text-right pb-1">單價</th>
                      <th className="text-right pb-1">數量</th>
                      <th className="text-right pb-1">小計</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {order.items.map((item) => (
                      <tr key={item.id}>
                        <td className="py-1">{item.product_name}</td>
                        <td className="py-1 text-right">NT$ {item.unit_price.toLocaleString()}</td>
                        <td className="py-1 text-right">{item.quantity}</td>
                        <td className="py-1 text-right font-medium">
                          NT$ {(item.unit_price * item.quantity).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-border font-medium">
                      <td colSpan={3} className="pt-2 text-right text-muted-foreground">合計</td>
                      <td className="pt-2 text-right">NT$ {totalFor(order).toLocaleString()}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
