import { createContext, useCallback, useContext, useRef, useState } from "react";
import { Check } from "lucide-react";

const ToastContext = createContext(null);

// 輕量 toast：右下角浮出，3 秒後自動消失。
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const showToast = useCallback((message) => {
    const id = ++idRef.current;
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="pointer-events-none fixed bottom-6 right-6 z-[60] flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="flex items-center gap-2 rounded-lg bg-forest px-4 py-3 text-sm text-accent-foreground shadow-lg animate-fade-in"
          >
            <Check className="h-4 w-4" />
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast 必須在 ToastProvider 內使用");
  return ctx;
}
