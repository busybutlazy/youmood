import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { heroSlides } from "@/data/marketing";
import { cn } from "@/lib/utils";

export default function HeroCarousel() {
  const [index, setIndex] = useState(0);
  const count = heroSlides.length;

  const go = useCallback(
    (next) => setIndex(((next % count) + count) % count),
    [count]
  );

  // 自動輪播
  useEffect(() => {
    const timer = setInterval(() => go(index + 1), 6000);
    return () => clearInterval(timer);
  }, [index, go]);

  return (
    <section className="relative h-[72vh] min-h-[460px] w-full overflow-hidden bg-foreground">
      {heroSlides.map((slide, i) => (
        <div
          key={slide.id}
          className={cn(
            "absolute inset-0 transition-opacity duration-1000",
            i === index ? "opacity-100" : "pointer-events-none opacity-0"
          )}
        >
          <img
            src={slide.image}
            alt={slide.title}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-foreground/60 via-foreground/25 to-transparent" />
          <div className="absolute inset-0 flex items-center">
            <div className="mx-auto w-full max-w-7xl px-6 lg:px-8">
              <div className="max-w-xl text-cream">
                <p className="mb-3 text-sm font-medium tracking-[0.2em] text-cream/85">
                  {slide.subtitle}
                </p>
                <h2 className="mb-4 text-5xl font-semibold leading-tight md:text-6xl">
                  {slide.title}
                </h2>
                <p className="mb-8 text-base text-cream/85 md:text-lg">
                  {slide.description}
                </p>
                <Link
                  to={slide.cta.to}
                  className="inline-flex h-12 items-center justify-center rounded-md bg-cream px-8 text-base font-medium tracking-wide text-wood transition-colors hover:bg-cream/90"
                >
                  {slide.cta.label}
                </Link>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* 左右箭頭 */}
      <button
        type="button"
        aria-label="上一張"
        onClick={() => go(index - 1)}
        className="absolute left-4 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-cream/80 text-wood backdrop-blur transition hover:bg-cream"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        type="button"
        aria-label="下一張"
        onClick={() => go(index + 1)}
        className="absolute right-4 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-cream/80 text-wood backdrop-blur transition hover:bg-cream"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      {/* 指示點 */}
      <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 gap-2">
        {heroSlides.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`第 ${i + 1} 張`}
            onClick={() => go(i)}
            className={cn(
              "h-2 rounded-full transition-all duration-300",
              i === index ? "w-6 bg-cream" : "w-2 bg-cream/50"
            )}
          />
        ))}
      </div>
    </section>
  );
}
