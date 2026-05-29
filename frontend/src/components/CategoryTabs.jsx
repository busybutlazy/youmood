import { cn } from "@/lib/utils";

/**
 * 分類篩選 tabs。第一個 tab 為「全部」（value = null）。
 * @param {{ categories: {id:number,name:string}[], value: number|null, onChange: (id:number|null)=>void }} props
 */
export default function CategoryTabs({ categories, value, onChange }) {
  const tabs = [{ id: null, name: "全部" }, ...categories];

  return (
    <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
      {tabs.map((tab) => {
        const active = value === tab.id;
        return (
          <button
            key={tab.id ?? "all"}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              "shrink-0 rounded-full border px-5 py-2 text-sm font-medium transition-colors duration-200",
              active
                ? "border-wood bg-wood text-primary-foreground"
                : "border-border bg-transparent text-muted-foreground hover:border-wood/40 hover:text-wood"
            )}
          >
            {tab.name}
          </button>
        );
      })}
    </div>
  );
}
