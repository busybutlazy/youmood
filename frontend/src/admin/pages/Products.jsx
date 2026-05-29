import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { getProducts } from "../../api/products.js";
import { deleteProduct } from "../../api/admin.js";

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setProducts(await getProducts());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleDelete(id, name) {
    if (!window.confirm(`確定刪除「${name}」？此操作無法復原，圖片也會一併刪除。`)) return;
    try {
      await deleteProduct(id);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) return <p className="text-muted-foreground">載入中…</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-2xl text-primary">商品管理</h1>
        <Link
          to="/admin/products/new"
          className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:opacity-90 transition-opacity"
        >
          <Plus size={15} /> 新增商品
        </Link>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-destructive/10 text-destructive px-4 py-2 text-sm">
          {error}
        </div>
      )}

      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-3">商品名稱</th>
              <th className="text-left px-4 py-3">分類</th>
              <th className="text-left px-4 py-3">售價</th>
              <th className="text-left px-4 py-3">上架</th>
              <th className="text-left px-4 py-3">圖片</th>
              <th className="px-4 py-3 w-24"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {products.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                  尚無商品，
                  <Link to="/admin/products/new" className="text-primary hover:underline">
                    立即新增
                  </Link>
                </td>
              </tr>
            )}
            {products.map((p) => (
              <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 font-medium">{p.name}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {p.category_name ?? <span className="text-xs">—</span>}
                </td>
                <td className="px-4 py-3">NT$ {p.price.toLocaleString()}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                      p.is_available
                        ? "bg-forest-light text-forest"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {p.is_available ? "上架" : "下架"}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground text-xs">
                  {p.images.length} 張
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-3 justify-end">
                    <Link
                      to={`/admin/products/${p.id}/edit`}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Pencil size={15} />
                    </Link>
                    <button
                      onClick={() => handleDelete(p.id, p.name)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
