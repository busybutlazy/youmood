import { useState } from "react";
import { TreePine } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * 商品圖片，含 fallback：
 * 無 src 或載入失敗時 → 灰色背景 + 居中木頭 icon。
 */
export default function ProductImage({ src, alt, className, iconClassName }) {
  const [errored, setErrored] = useState(false);
  const showFallback = !src || errored;

  return (
    <div className={cn("relative overflow-hidden bg-muted", className)}>
      {showFallback ? (
        <div className="flex h-full w-full items-center justify-center bg-muted">
          <TreePine
            className={cn("text-wood-light", iconClassName || "h-12 w-12")}
            strokeWidth={1.25}
          />
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onError={() => setErrored(true)}
          className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
        />
      )}
    </div>
  );
}
