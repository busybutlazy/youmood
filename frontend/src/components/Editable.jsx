import { useState, useRef } from "react";
import { Pencil, ImagePlus } from "lucide-react";
import { useAdminMode } from "@/hooks/useAdminMode";

// ── EditableText ──────────────────────────────────────────────────────────────
// Wraps any block of content. When admin is logged in, shows a pencil button
// on hover that opens a text/textarea edit modal.
export function EditableText({ value, onSave, multiline = false, hint, validate, children }) {
  const isAdmin = useAdminMode();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  if (!isAdmin) return children;

  function handleOpen() {
    setDraft(value ?? "");
    setError(null);
    setOpen(true);
  }

  async function handleSave() {
    if (validate) {
      const err = validate(draft);
      if (err) { setError(err); return; }
    }
    setSaving(true);
    try {
      await onSave(draft);
      setOpen(false);
    } catch {
      setError("儲存失敗，請稍後再試");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="group relative">
      {children}
      <button
        onClick={handleOpen}
        className="absolute -right-2 -top-2 z-10 hidden h-6 w-6 items-center justify-center rounded-full bg-wood text-white shadow-md group-hover:flex"
        title="編輯文字"
      >
        <Pencil className="h-3 w-3" />
      </button>

      {open && (
        <EditModal
          multiline={multiline}
          draft={draft}
          onChange={setDraft}
          saving={saving}
          error={error}
          onSave={handleSave}
          hint={hint}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}

function EditModal({ multiline, draft, onChange, saving, error, hint, onSave, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
        <h3 className="mb-4 text-base font-semibold text-foreground">編輯內容</h3>

        {multiline ? (
          <textarea
            autoFocus
            rows={6}
            value={draft}
            onChange={(e) => onChange(e.target.value)}
            placeholder="輸入內容（換行 = 新段落）"
            className="w-full rounded-md border border-border bg-background p-2.5 text-sm text-foreground outline-none focus:border-wood focus:ring-1 focus:ring-wood/30 resize-none"
          />
        ) : (
          <input
            autoFocus
            type="text"
            value={draft}
            onChange={(e) => onChange(e.target.value)}
            className="w-full rounded-md border border-border bg-background p-2.5 text-sm text-foreground outline-none focus:border-wood focus:ring-1 focus:ring-wood/30"
          />
        )}

        {hint && <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>}
        {error && <p className="mt-2 text-xs text-red-500">{error}</p>}

        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-md px-4 py-2 text-sm text-muted-foreground hover:bg-muted"
          >
            取消
          </button>
          <button
            onClick={onSave}
            disabled={saving}
            className="rounded-md bg-wood px-4 py-2 text-sm font-medium text-white hover:bg-wood/90 disabled:opacity-60"
          >
            {saving ? "儲存中..." : "儲存"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── EditableImage ─────────────────────────────────────────────────────────────
// Wraps an image container. Shows an upload button on hover when admin is
// logged in.
export function EditableImage({ onSave, children }) {
  const isAdmin = useAdminMode();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const fileRef = useRef(null);

  if (!isAdmin) return children;

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      await onSave(file);
    } catch {
      setError("上傳失敗");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  return (
    <div className="group relative">
      {children}
      <button
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        className="absolute right-2 top-2 z-10 hidden h-7 w-7 items-center justify-center rounded-full bg-wood text-white shadow-md group-hover:flex disabled:opacity-60"
        title="更換圖片"
      >
        {uploading ? (
          <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
        ) : (
          <ImagePlus className="h-3 w-3" />
        )}
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
      {error && (
        <span className="absolute bottom-2 left-2 z-10 rounded bg-red-500 px-2 py-1 text-xs text-white">
          {error}
        </span>
      )}
    </div>
  );
}
