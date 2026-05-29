import { useEffect, useState } from "react";
import { useParams, useLocation, Link } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { formatPrice } from "@/lib/utils";

export default function OrderSuccess() {
  const { id } = useParams();
  const location = useLocation();
  // 摘要從結帳時送出的回傳資料取得（不再呼叫 API）
  const [order] = useState(location.state?.order || null);

  // 直接刷新 / 無 state 時的保底顯示
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, []);

  const total = order
    ? order.items.reduce((s, it) => s + it.unit_price * it.quantity, 0)
    : 0;

  return (
    <div className="mx-auto max-w-2xl px-6 py-20 text-center">
      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-forest-light">
        <CheckCircle2 className="h-12 w-12 text-forest" strokeWidth={1.5} />
      </div>

      <h1 className="text-3xl font-semibold md:text-4xl">感謝您的訂購！</h1>
      <p className="mt-3 text-muted-foreground">
        我們已收到您的訂單，將盡快與您聯繫確認。
      </p>

      <p className="mt-6 inline-flex items-center gap-2 rounded-full bg-secondary px-5 py-2 text-sm">
        <span className="text-muted-foreground">訂單編號</span>
        <span className="font-semibold text-wood">
          #{String(id).padStart(5, "0")}
        </span>
      </p>

      {order && (
        <div className="mt-10 rounded-lg border border-border bg-card text-left">
          <h2 className="border-b border-border px-6 py-4 text-base font-semibold">
            訂單摘要
          </h2>
          <ul className="divide-y divide-border">
            {order.items.map((it) => (
              <li
                key={it.id ?? it.product_id}
                className="flex items-center justify-between px-6 py-4"
              >
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
        </div>
      )}

      <Link
        to="/"
        className="mt-10 inline-flex h-12 items-center justify-center rounded-md bg-wood px-8 text-base font-medium text-primary-foreground transition-colors hover:bg-wood/90"
      >
        回到首頁
      </Link>
    </div>
  );
}
