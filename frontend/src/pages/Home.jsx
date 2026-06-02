import { useEffect, useState } from "react";
import { usePageTitle } from "@/lib/usePageTitle";
import { Link } from "react-router-dom";
import { Leaf, Hand, Sparkles, ArrowRight } from "lucide-react";
import HeroCarousel from "@/components/HeroCarousel";
import ProductCard from "@/components/ProductCard";
import SkeletonCard from "@/components/SkeletonCard";
import { getProducts } from "@/api/products";
import { features, brandIntro } from "@/data/marketing";

const featureIcons = { leaf: Leaf, hand: Hand, sparkles: Sparkles };

export default function Home() {
  usePageTitle(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getProducts({ availableOnly: true })
      .then((data) => {
        if (active) setProducts((data || []).slice(0, 4));
      })
      .catch(() => active && setProducts([]))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  return (
    <div>
      <HeroCarousel />

      {/* 精選商品 */}
      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="mb-10 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-semibold md:text-4xl">精選商品</h2>
            <p className="mt-2 text-muted-foreground">
              嚴選手作，每一件都是獨一無二
            </p>
          </div>
          <Link
            to="/products"
            className="hidden shrink-0 items-center gap-1 text-sm font-medium text-wood transition-colors hover:text-wood/70 sm:inline-flex"
          >
            查看全部
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
            : products.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>

        <div className="mt-10 text-center sm:hidden">
          <Link
            to="/products"
            className="inline-flex items-center gap-1 text-sm font-medium text-wood"
          >
            查看全部商品
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* 品牌介紹 */}
      <section className="bg-secondary/40">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-20 lg:grid-cols-2 lg:px-8">
          <div className="overflow-hidden rounded-lg">
            <img
              src={brandIntro.image}
              alt={brandIntro.title}
              className="aspect-[4/3] w-full object-cover"
            />
          </div>
          <div>
            <p className="text-sm font-medium tracking-[0.2em] text-forest">
              {brandIntro.eyebrow}
            </p>
            <h2 className="mt-3 text-3xl font-semibold md:text-4xl">
              {brandIntro.title}
            </h2>
            <div className="mt-5 space-y-4 leading-relaxed text-muted-foreground">
              {brandIntro.paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
            <Link
              to={brandIntro.cta.to}
              className="mt-7 inline-flex h-11 items-center justify-center rounded-md border border-wood/40 px-6 text-sm font-medium text-wood transition-colors hover:bg-wood hover:text-primary-foreground"
            >
              {brandIntro.cta.label}
            </Link>
          </div>
        </div>
      </section>

      {/* 特色 */}
      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-3">
          {features.map((f) => {
            const Icon = featureIcons[f.icon];
            return (
              <div key={f.title} className="text-center">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-forest-light">
                  <Icon className="h-7 w-7 text-forest" strokeWidth={1.5} />
                </div>
                <h3 className="text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {f.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
