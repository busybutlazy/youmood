import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Pencil, ImagePlus } from "lucide-react";
import { heroSlides } from "@/data/marketing";
import { cn } from "@/lib/utils";
import { useAdminMode } from "@/hooks/useAdminMode";

// slides: array of {id, subtitle, title, description, image, cta}
// onEditSlide?: async (index, { subtitle, title, description, imageFile? }) => void
export default function HeroCarousel({ slides = heroSlides, onEditSlide }) {
  const isAdmin = useAdminMode();
  const [index, setIndex] = useState(0);
  const [editingIndex, setEditingIndex] = useState(null);
  const count = slides.length;

  const go = useCallback(
    (next) => setIndex(((next % count) + count) % count),
    [count]
  );

  useEffect(() => {
    const timer = setInterval(() => go(index + 1), 6000);
    return () => clearInterval(timer);
  }, [index, go]);

  return (
    <section className="relative h-[72vh] min-h-[460px] w-full overflow-hidden bg-foreground">
      {slides.map((slide, i) => (
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

          {/* Admin edit button — only on the active slide */}
          {isAdmin && onEditSlide && i === index && (
            <button
              onClick={() => setEditingIndex(i)}
              className="absolute right-16 top-4 z-20 flex items-center gap-1.5 rounded-full bg-wood/90 px-3 py-1.5 text-xs font-medium text-white shadow-md backdrop-blur hover:bg-wood"
            >
              <Pencil className="h-3 w-3" />
              編輯此張
            </button>
          )}
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
        {slides.map((_, i) => (
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

      {/* Slide edit modal */}
      {editingIndex !== null && (
        <SlideEditModal
          index={editingIndex}
          slide={slides[editingIndex]}
          onSave={async (changes) => {
            await onEditSlide(editingIndex, changes);
            setEditingIndex(null);
          }}
          onClose={() => setEditingIndex(null)}
        />
      )}
    </section>
  );
}

function SlideEditModal({ index, slide, onSave, onClose }) {
  const [draft, setDraft] = useState({
    subtitle: slide.subtitle,
    title: slide.title,
    description: slide.description,
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const fileRef = useRef(null);

  function handleImageSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    e.target.value = "";
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      await onSave({ ...draft, imageFile: imageFile ?? undefined });
    } catch {
      setError("儲存失敗，請稍後再試");
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
        <h3 className="mb-5 text-base font-semibold">
          編輯第 {index + 1} 張投影片
        </h3>

        <div className="space-y-4">
          <Field label="副標題（小字）">
            <input
              type="text"
              value={draft.subtitle}
              onChange={(e) => setDraft((d) => ({ ...d, subtitle: e.target.value }))}
              className="modal-input"
            />
          </Field>
          <Field label="主標題（大字）">
            <input
              type="text"
              value={draft.title}
              onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
              className="modal-input"
            />
          </Field>
          <Field label="描述文字">
            <textarea
              rows={2}
              value={draft.description}
              onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
              className="modal-input resize-none"
            />
          </Field>
          <Field label="背景圖片">
            <div className="flex items-center gap-3">
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="preview"
                  className="h-16 w-24 rounded object-cover"
                />
              ) : (
                <img
                  src={slide.image}
                  alt="current"
                  className="h-16 w-24 rounded object-cover opacity-60"
                />
              )}
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted"
              >
                <ImagePlus className="h-4 w-4" />
                更換圖片
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageSelect}
              />
            </div>
          </Field>
        </div>

        {error && <p className="mt-3 text-xs text-red-500">{error}</p>}

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-md px-4 py-2 text-sm text-muted-foreground hover:bg-muted"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-md bg-wood px-4 py-2 text-sm font-medium text-white hover:bg-wood/90 disabled:opacity-60"
          >
            {saving ? "儲存中..." : "儲存"}
          </button>
        </div>
      </div>

      <style>{`
        .modal-input {
          width: 100%;
          border: 1px solid hsl(var(--border));
          border-radius: calc(var(--radius) - 2px);
          background: hsl(var(--background));
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          color: hsl(var(--foreground));
          outline: none;
        }
        .modal-input:focus {
          border-color: hsl(var(--wood));
          box-shadow: 0 0 0 2px hsl(var(--wood) / .15);
        }
      `}</style>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}
