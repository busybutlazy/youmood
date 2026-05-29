import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ChevronLeft, ShoppingBag, TreePine } from "lucide-react";
import Badge from "@/components/ui/Badge";
import QuantityStepper from "@/components/QuantityStepper";
import SkeletonCard from "@/components/SkeletonCard";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/context/ToastContext";
import { getProduct } from "@/api/products";
import { formatPrice, cn } from "@/lib/utils";

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { showToast } = useToast();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeImg, setActiveImg] = useState(0);
  const [qty, setQty] = useState(1);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    setActiveImg(0);
    setQty(1);
    getProduct(id)
      .then((data) => active && setProduct(data))
      .catch((err) => active && setError(err.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [id]);

  const handleAdd = () => {
    addItem(product, qty);
    showToast(`已將「${product.name}」加入購物車`);
  };

  if (loading) {
    return (
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-12 lg:grid-cols-2 lg:px-8">
        <SkeletonCard />
        <div className="space-y-4">
          <div className="h-8 w-2/3 animate-pulse rounded bg-muted" />
          <div className="h-5 w-24 animate-pulse rounded bg-muted" />
          <div className="h-24 w-full animate-pulse rounded bg-muted" />
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        <p className="text-lg font-medium">{error || "找不到此商品"}</p>
        <Link
          to="/products"
          className="mt-6 inline-flex h-11 items-center justify-center rounded-md border border-wood/40 px-6 text-sm font-medium text-wood transition-colors hover:bg-wood hover:text-primary-foreground"
        >
          回到商品列表
        </Link>
      </div>
    );
  }

  const images = product.images || [];
  const current = images[activeImg];

  return (
    <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-wood"
      >
        <ChevronLeft className="h-4 w-4" />
        返回
      </button>

      <div className="grid gap-10 lg:grid-cols-2">
        {/* 圖片區 */}
        <div>
          <div className="aspect-square w-full overflow-hidden rounded-lg bg-muted">
            {current ? (
              <img
                src={current.url}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <TreePine className="h-20 w-20 text-wood-light" strokeWidth={1} />
              </div>
            )}
          </div>

          {images.length > 1 && (
            <div className="no-scrollbar mt-4 flex gap-3 overflow-x-auto">
              {images.map((img, i) => (
                <button
                  key={img.id ?? i}
                  type="button"
                  onClick={() => setActiveImg(i)}
                  className={cn(
                    "h-20 w-20 shrink-0 overflow-hidden rounded-md border-2 transition-colors",
                    i === activeImg ? "border-wood" : "border-transparent"
                  )}
                >
                  <img
                    src={img.url}
                    alt={`${product.name} ${i + 1}`}
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 資訊區 */}
        <div className="flex flex-col">
          {product.category_name && (
            <div className="mb-3">
              <Badge>{product.category_name}</Badge>
            </div>
          )}
          <h1 className="text-3xl font-semibold leading-tight md:text-4xl">
            {product.name}
          </h1>
          <p className="mt-4 text-3xl font-semibold text-wood">
            {formatPrice(product.price)}
          </p>

          {product.description && (
            <p className="mt-6 whitespace-pre-line leading-relaxed text-muted-foreground">
              {product.description}
            </p>
          )}

          <div className="mt-8 flex items-center gap-4">
            <span className="text-sm font-medium text-foreground">數量</span>
            <QuantityStepper value={qty} onChange={setQty} />
          </div>

          <button
            type="button"
            onClick={handleAdd}
            className="mt-8 inline-flex items-center justify-center gap-2 rounded-md bg-wood px-8 py-4 text-base font-medium text-primary-foreground transition-colors hover:bg-wood/90"
          >
            <ShoppingBag className="h-5 w-5" />
            加入購物車
          </button>
        </div>
      </div>
    </div>
  );
}
