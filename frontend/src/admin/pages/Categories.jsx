import { useState, useEffect, useCallback } from "react";
import { Pencil, Trash2, Plus, Check, X } from "lucide-react";
import { getCategories } from "../../api/categories.js";
import { createCategory, updateCategory, deleteCategory } from "../../api/admin.js";

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // new category form
  const [newName, setNewName] = useState("");
  const [newOrder, setNewOrder] = useState(0);
  const [creating, setCreating] = useState(false);

  // inline edit
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editOrder, setEditOrder] = useState(0);

  const load = useCallback(async () => {
    try {
      setCategories(await getCategories());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleCreate(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await createCategory({ name: newName.trim(), sort_order: Number(newOrder) });
      setNewName(""); setNewOrder(0);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  }

  function startEdit(cat) {
    setEditId(cat.id);
    setEditName(cat.name);
    setEditOrder(cat.sort_order);
  }

  async function saveEdit(id) {
    try {
      await updateCategory(id, { name: editName.trim(), sort_order: Number(editOrder) });
      setEditId(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("確定刪除此分類？關聯商品的分類將設為空白。")) return;
    try {
      await deleteCategory(id);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) return <p className="text-muted-foreground">載入中…</p>;

  return (
    <div className="max-w-xl">
      <h1 className="font-serif text-2xl text-primary mb-6">分類管理</h1>

      {error && (
        <div className="mb-4 rounded-md bg-destructive/10 text-destructive px-4 py-2 text-sm">
          {error}
        </div>
      )}

      <div className="rounded-xl border border-border overflow-hidden mb-8">
        <table className="w-full text-sm">
          <thead className="bg-muted text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-3">名稱</th>
              <th className="text-left px-4 py-3 w-24">排序</th>
              <th className="px-4 py-3 w-24"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {categories.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">
                  尚無分類
                </td>
              </tr>
            )}
            {categories.map((cat) =>
              editId === cat.id ? (
                <tr key={cat.id} className="bg-muted/30">
                  <td className="px-4 py-2">
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full rounded border border-input px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="number"
                      value={editOrder}
                      onChange={(e) => setEditOrder(e.target.value)}
                      className="w-16 rounded border border-input px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  </td>
                  <td className="px-4 py-2 flex gap-2 justify-end">
                    <button onClick={() => saveEdit(cat.id)} className="text-accent hover:opacity-70">
                      <Check size={16} />
                    </button>
                    <button onClick={() => setEditId(null)} className="text-muted-foreground hover:opacity-70">
                      <X size={16} />
                    </button>
                  </td>
                </tr>
              ) : (
                <tr key={cat.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">{cat.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{cat.sort_order}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-3 justify-end">
                      <button onClick={() => startEdit(cat)} className="text-muted-foreground hover:text-foreground">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => handleDelete(cat.id)} className="text-muted-foreground hover:text-destructive">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>

      {/* Add form */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-medium mb-4 flex items-center gap-2">
          <Plus size={15} /> 新增分類
        </h2>
        <form onSubmit={handleCreate} className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-xs text-muted-foreground mb-1">名稱</label>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="木製品"
              required
              className="w-full rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="w-24">
            <label className="block text-xs text-muted-foreground mb-1">排序</label>
            <input
              type="number"
              value={newOrder}
              onChange={(e) => setNewOrder(e.target.value)}
              className="w-full rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <button
            type="submit"
            disabled={creating}
            className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {creating ? "新增中…" : "新增"}
          </button>
        </form>
      </div>
    </div>
  );
}
