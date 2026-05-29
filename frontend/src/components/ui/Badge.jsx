import { cn } from "@/lib/utils";

// 分類標籤：森林綠 --forest 色系
export default function Badge({ children, className }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-forest-light px-3 py-1 text-xs font-medium tracking-wider text-forest",
        className
      )}
    >
      {children}
    </span>
  );
}
