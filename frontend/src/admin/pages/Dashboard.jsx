import { useEffect, useState } from "react";
import { ShoppingBag, TrendingUp, Clock, BarChart2 } from "lucide-react";
import { getStats } from "../../api/admin.js";

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-muted-foreground">{label}</span>
        <div className={`flex h-9 w-9 items-center justify-center rounded-full ${color}`}>
          <Icon size={16} />
        </div>
      </div>
      <p className="text-2xl font-semibold">{value}</p>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getStats()
      .then(setStats)
      .catch((err) => setError(err.message));
  }, []);

  if (error) {
    return (
      <div className="rounded-md bg-destructive/10 text-destructive px-4 py-3 text-sm">
        {error}
      </div>
    );
  }

  if (!stats) {
    return <p className="text-muted-foreground text-sm">載入中…</p>;
  }

  return (
    <div>
      <h1 className="font-serif text-2xl text-primary mb-6">儀表板</h1>

      <div className="grid grid-cols-2 gap-4 mb-8 lg:grid-cols-3">
        <StatCard
          icon={ShoppingBag}
          label="本月訂單"
          value={stats.total_orders}
          color="bg-blue-100 text-blue-700"
        />
        <StatCard
          icon={TrendingUp}
          label="本月營收"
          value={`NT$ ${stats.revenue.toLocaleString()}`}
          color="bg-forest-light text-forest"
        />
        <StatCard
          icon={Clock}
          label="待確認訂單"
          value={stats.pending_count}
          color="bg-yellow-100 text-yellow-700"
        />
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart2 size={16} className="text-muted-foreground" />
          <h2 className="text-sm font-medium">本月熱銷商品 TOP 5</h2>
        </div>

        {stats.top_products.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">本月尚無銷售記錄</p>
        ) : (
          <div className="space-y-3">
            {stats.top_products.map((p, i) => {
              const max = stats.top_products[0].total_qty;
              const pct = max > 0 ? Math.round((p.total_qty / max) * 100) : 0;
              return (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-5 text-xs text-muted-foreground tabular-nums text-right">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm truncate">{p.product_name}</span>
                      <span className="text-sm font-medium tabular-nums ml-3">{p.total_qty}</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
