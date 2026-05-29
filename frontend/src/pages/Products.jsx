import { useEffect, useMemo, useState } from "react";
import { PackageOpen, Search } from "lucide-react";
import CategoryTabs from "@/components/CategoryTabs";
import ProductCard from "@/components/ProductCard";
import SkeletonCard from "@/components/SkeletonCard";
import { getCategories } from "@/api/categories";
import { getProducts } from "@/api/products";

export default function Products() {
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    getCategories()
      .then((data) => setCategories(data || []))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    getProducts({ categoryId: activeCategory ?? undefined, availableOnly: true })
      .then((data) => active && setProducts(data || []))
      .catch((err) => {
        if (active) {
          setProducts([]);
          setError(err.message);
        }
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [activeCategory]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.description || "").toLowerCase().includes(q)
    );
  }, [products, query]);

  return (
    <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold md:text-4xl">全部商品</h1>
        <p className="mt-2 text-muted-foreground">手作的溫度，獨一無二的存在</p>
      </header>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜尋商品名稱..."
            className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-4 text-sm outline-none transition focus:border-wood focus:ring-2 focus:ring-wood/20"
          />
        </div>
        <CategoryTabs
          categories={categories}
          value={activeCategory}
          onChange={(cat) => { setActiveCategory(cat); setQuery(""); }}
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-5 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : error ? (
        <EmptyState title="載入失敗" description={error} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title={query ? `找不到「${query}」相關商品` : "目前沒有符合條件的商品"}
          description={query ? "試試其他關鍵字，或清除搜尋後瀏覽全部商品。" : "請稍後再來看看，或選擇其他分類。"}
        />
      ) : (
        <div className="grid grid-cols-2 gap-5 lg:grid-cols-3">
          {filtered.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState({ title, description }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
      <PackageOpen className="h-14 w-14 text-wood-light" strokeWidth={1.25} />
      <p className="text-lg font-medium text-foreground">{title}</p>
      {description && (
        <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      )}
    </div>
  );
}
