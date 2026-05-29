import { useState } from "react";
import { Mail, Instagram, Clock, MapPin } from "lucide-react";
import { useToast } from "@/context/ToastContext";
import { contactInfo } from "@/data/marketing";

export default function Contact() {
  const { showToast } = useToast();
  const [form, setForm] = useState({ name: "", subject: "", message: "" });
  const [submitting, setSubmitting] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const onSubmit = (e) => {
    e.preventDefault();
    setSubmitting(true);
    // 此頁為純前端聯絡表單（無對應 API），模擬送出。
    setTimeout(() => {
      setSubmitting(false);
      setForm({ name: "", subject: "", message: "" });
      showToast("訊息已送出，我們會盡快回覆您！");
    }, 700);
  };

  const items = [
    { icon: Mail, label: "電子郵件", value: contactInfo.email },
    { icon: Instagram, label: "Instagram", value: contactInfo.instagram },
    { icon: Clock, label: "營業時間", value: contactInfo.hours },
    { icon: MapPin, label: "工作室位置", value: contactInfo.location },
  ];

  return (
    <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-medium tracking-[0.2em] text-forest">
          期待與您的交流
        </p>
        <h1 className="mt-3 text-3xl font-semibold md:text-4xl">傳送訊息</h1>
        <p className="mt-3 text-muted-foreground">
          有任何問題或合作提案，歡迎填寫以下表單與我們聯繫。
        </p>
      </div>

      <div className="mt-14 grid gap-12 lg:grid-cols-5">
        {/* 表單 */}
        <form onSubmit={onSubmit} className="space-y-5 lg:col-span-3">
          <Field label="姓名" required>
            <input
              type="text"
              required
              value={form.name}
              onChange={set("name")}
              placeholder="您的姓名"
              className="form-input"
            />
          </Field>
          <Field label="主旨">
            <input
              type="text"
              value={form.subject}
              onChange={set("subject")}
              placeholder="訊息主旨"
              className="form-input"
            />
          </Field>
          <Field label="訊息內容" required>
            <textarea
              required
              rows={6}
              value={form.message}
              onChange={set("message")}
              placeholder="請輸入您的訊息..."
              className="form-input resize-none"
            />
          </Field>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex h-12 items-center justify-center rounded-md bg-wood px-8 text-base font-medium text-primary-foreground transition-colors hover:bg-wood/90 disabled:opacity-60"
          >
            {submitting ? "送出中..." : "送出訊息"}
          </button>
        </form>

        {/* 聯絡資訊 */}
        <div className="lg:col-span-2">
          <div className="rounded-lg border border-border bg-secondary/40 p-8">
            <h2 className="text-xl font-semibold">聯絡資訊</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              您也可以透過以下方式與我們聯繫。
            </p>
            <ul className="mt-6 space-y-5">
              {items.map((it) => (
                <li key={it.label} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-forest-light">
                    <it.icon className="h-4 w-4 text-forest" />
                  </span>
                  <div>
                    <p className="text-xs tracking-wider text-muted-foreground">
                      {it.label}
                    </p>
                    <p className="text-sm font-medium text-foreground">
                      {it.value}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <style>{`
        .form-input {
          width: 100%;
          border-radius: var(--radius);
          border: 1px solid hsl(var(--input));
          background: hsl(var(--background));
          padding: 0.7rem 0.9rem;
          font-size: 0.9rem;
          color: hsl(var(--foreground));
          outline: none;
          transition: border-color .2s, box-shadow .2s;
        }
        .form-input::placeholder { color: hsl(var(--muted-foreground)); opacity: .7; }
        .form-input:focus {
          border-color: hsl(var(--wood));
          box-shadow: 0 0 0 2px hsl(var(--wood) / .15);
        }
      `}</style>
    </div>
  );
}

function Field({ label, required, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-foreground">
        {label}
        {required && <span className="ml-0.5 text-wood">*</span>}
      </span>
      {children}
    </label>
  );
}
