import { useEffect, useState } from "react";
import { PackageOpen } from "lucide-react";
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

  // 分類只抓一次
  useEffect(() => {
    getCategories()
      .then((data) => setCategories(data || []))
      .catch(() => setCategories([]));
  }, []);

  // 商品隨分類變動重抓
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

  return (
    <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold md:text-4xl">全部商品</h1>
        <p className="mt-2 text-muted-foreground">
          手作的溫度，獨一無二的存在
        </p>
      </header>

      <div className="mb-10">
        <CategoryTabs
          categories={categories}
          value={activeCategory}
          onChange={setActiveCategory}
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-5 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : error ? (
        <EmptyState
          title="載入失敗"
          description={error}
        />
      ) : products.length === 0 ? (
        <EmptyState
          title="目前沒有符合條件的商品"
          description="請稍後再來看看，或選擇其他分類。"
        />
      ) : (
        <div className="grid grid-cols-2 gap-5 lg:grid-cols-3">
          {products.map((p) => (
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
