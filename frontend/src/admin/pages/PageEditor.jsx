import { Link } from "react-router-dom";
import { ExternalLink } from "lucide-react";

const PAGES = [
  {
    label: "首頁",
    to: "/",
    description: "品牌介紹圖片、標題、副標題",
  },
  {
    label: "關於我們",
    to: "/about",
    description: "我們的故事文字與圖片",
  },
  {
    label: "聯絡我們",
    to: "/contact",
    description: "Email、Instagram、營業時間、工作室位置",
  },
];

export default function PageEditor() {
  return (
    <div>
      <h1 className="text-2xl font-semibold">頁面管理</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        點選頁面後，頁面上的可編輯欄位會出現鉛筆圖示，點擊即可修改。
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PAGES.map(({ label, to, description }) => (
          <Link
            key={to}
            to={to}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-start justify-between rounded-xl border border-border bg-card p-6 transition-shadow hover:shadow-md"
          >
            <div>
              <p className="font-semibold text-foreground">{label}</p>
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            </div>
            <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-wood" />
          </Link>
        ))}
      </div>

      <p className="mt-8 rounded-lg bg-secondary/50 px-4 py-3 text-sm text-muted-foreground">
        提示：頁面會在新分頁開啟。修改完成後可直接關閉分頁返回後台。
      </p>
    </div>
  );
}
