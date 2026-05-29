import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Upload, Trash2, Star } from "lucide-react";
import { getProduct } from "../../api/products.js";
import { getCategories } from "../../api/categories.js";
import {
  createProduct, updateProduct,
  uploadImage, deleteImage, setPrimaryImage,
} from "../../api/admin.js";

const EMPTY_FORM = {
  name: "", description: "", price: "", category_id: "", is_available: true,
};

export default function ProductForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState(EMPTY_FORM);
  const [categories, setCategories] = useState([]);
  const [images, setImages] = useState([]);
  const [productId, setProductId] = useState(id ? Number(id) : null);
  const [saved, setSaved] = useState(isEdit); // edit mode: product exists
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef(null);

  useEffect(() => {
    getCategories().then(setCategories).catch(() => {});
    if (isEdit) {
      getProduct(id)
        .then((p) => {
          setForm({
            name: p.name,
            description: p.description ?? "",
            price: String(p.price),
            category_id: p.category_id ? String(p.category_id) : "",
            is_available: p.is_available,
          });
          setImages(p.images);
        })
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, [id, isEdit]);

  function set(field) {
    return (e) => {
      const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
      setForm((f) => ({ ...f, [field]: value }));
    };
  }

  async function handleSave(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    const body = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      price: Number(form.price),
      category_id: form.category_id ? Number(form.category_id) : null,
      is_available: form.is_available,
    };
    try {
      if (isEdit) {
        await updateProduct(productId, body);
        setSaved(true);
      } else {
        const p = await createProduct(body);
        setProductId(p.id);
        setSaved(true);
        navigate(`/admin/products/${p.id}/edit`, { replace: true });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleUpload(e) {
    const file = e.target.files?.[0];
    if (!file || !productId) return;
    setUploading(true);
    setError("");
    try {
      const img = await uploadImage(productId, file);
      setImages((prev) => [...prev, img]);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleDeleteImage(imgId) {
    if (!window.confirm("確定刪除此圖片？")) return;
    try {
      await deleteImage(productId, imgId);
      setImages((prev) => prev.filter((i) => i.id !== imgId));
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleSetPrimary(imgId) {
    try {
      await setPrimaryImage(productId, imgId);
      setImages((prev) => prev.map((i) => ({ ...i, is_primary: i.id === imgId })));
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) return <p className="text-muted-foreground">載入中…</p>;

  return (
    <div className="max-w-2xl">
      <button
        onClick={() => navigate("/admin/products")}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft size={15} /> 返回列表
      </button>

      <h1 className="font-serif text-2xl text-primary mb-6">
        {isEdit ? "編輯商品" : "新增商品"}
      </h1>

      {error && (
        <div className="mb-4 rounded-md bg-destructive/10 text-destructive px-4 py-2 text-sm">
          {error}
        </div>
      )}

      {/* Product Info Form */}
      <form onSubmit={handleSave} className="rounded-xl border border-border bg-card p-6 space-y-4 mb-8">
        <div>
          <label className="block text-sm font-medium mb-1">商品名稱 *</label>
          <input
            value={form.name} onChange={set("name")} required
            className="w-full rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">商品描述</label>
          <textarea
            value={form.description} onChange={set("description")} rows={3}
            className="w-full rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">售價（NT$）*</label>
            <input
              type="number" min="0" step="1"
              value={form.price} onChange={set("price")} required
              className="w-full rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">分類</label>
            <select
              value={form.category_id} onChange={set("category_id")}
              className="w-full rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background"
            >
              <option value="">— 無分類 —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
          <input
            type="checkbox" checked={form.is_available} onChange={set("is_available")}
            className="rounded border-input"
          />
          上架販售
        </label>

        <button
          type="submit" disabled={saving}
          className="rounded-md bg-primary px-5 py-2 text-sm text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {saving ? "儲存中…" : isEdit ? "更新商品" : "建立商品"}
        </button>
      </form>

      {/* Images Section */}
      {saved && productId && (
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-sm font-medium mb-4">商品圖片</h2>

          {images.length > 0 && (
            <div className="grid grid-cols-3 gap-3 mb-4">
              {images.map((img) => (
                <div key={img.id} className="relative group rounded-lg overflow-hidden aspect-square border border-border">
                  <img src={img.url} alt="" className="w-full h-full object-cover" />

                  {img.is_primary && (
                    <span className="absolute top-1.5 left-1.5 flex items-center gap-1 rounded-full bg-primary/90 px-2 py-0.5 text-[10px] text-primary-foreground">
                      <Star size={10} fill="currentColor" /> 主圖
                    </span>
                  )}

                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    {!img.is_primary && (
                      <button
                        onClick={() => handleSetPrimary(img.id)}
                        title="設為主圖"
                        className="rounded-full bg-white/20 p-1.5 hover:bg-white/40 text-white"
                      >
                        <Star size={14} />
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteImage(img.id)}
                      title="刪除"
                      className="rounded-full bg-white/20 p-1.5 hover:bg-destructive text-white"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleUpload}
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 rounded-md border border-dashed border-input px-4 py-2 text-sm text-muted-foreground hover:border-primary hover:text-primary disabled:opacity-50 transition-colors"
          >
            <Upload size={15} />
            {uploading ? "上傳中…" : "上傳圖片"}
          </button>
          <p className="mt-1.5 text-xs text-muted-foreground">
            第一張上傳的圖片自動設為主圖；hover 圖片可切換主圖或刪除。
          </p>
        </div>
      )}
    </div>
  );
}
