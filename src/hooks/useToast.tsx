import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

type ToastVariant = 'success' | 'error' | 'info';

interface ToastItem {
  id: string;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  showToast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, variant: ToastVariant = 'success') => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev.slice(-3), { id, message, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3800);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-[calc(100vw-2rem)] pointer-events-none"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`pointer-events-auto flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm shadow-lg transition-all ${
              t.variant === 'error'
                ? 'bg-[#fff5f2] border-[#9f3c16]/40 text-[#7d2c0e]'
                : t.variant === 'info'
                  ? 'bg-[#faf6f0] border-[#dec0b7] text-[#181d1a]'
                  : 'bg-[#f6fbf5] border-[#476553]/40 text-[#181d1a]'
            }`}
          >
            {t.variant === 'error' ? (
              <AlertCircle className="w-4 h-4 text-[#9f3c16] shrink-0 mt-0.5" aria-hidden="true" />
            ) : t.variant === 'info' ? (
              <Info className="w-4 h-4 text-[#476553] shrink-0 mt-0.5" aria-hidden="true" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-[#476553] shrink-0 mt-0.5" aria-hidden="true" />
            )}
            <span className="flex-1 leading-snug">{t.message}</span>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              aria-label="Dismiss notification"
              className="p-0.5 rounded hover:bg-black/5 text-[#525954]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
