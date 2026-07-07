"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastTone = "success" | "error" | "info";

interface Toast {
  id: number;
  message: string;
  tone: ToastTone;
}

const ToastContext = createContext<(message: string, tone?: ToastTone) => void>(
  () => {},
);

export function useToast() {
  return useContext(ToastContext);
}

const icons = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
} as const;

const toneStyles = {
  success: "border-sage-200 bg-sage-50 text-sage-900 [&_svg]:text-sage-600",
  error: "border-clay-100 bg-clay-50 text-clay-700 [&_svg]:text-clay-600",
  info: "border-sky-100 bg-sky-50 text-sky-700 [&_svg]:text-sky-600",
} as const;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback(
    (message: string, tone: ToastTone = "success") => {
      const id = nextId.current++;
      setToasts((current) => [...current.slice(-2), { id, message, tone }]);
      // Long timeout on purpose — older adults read more slowly.
      setTimeout(() => dismiss(id), 8000);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div
        aria-live="polite"
        aria-label="Notifications"
        className="pointer-events-none fixed inset-x-4 bottom-24 z-50 flex flex-col items-center gap-3 sm:bottom-6"
      >
        {toasts.map((toast) => {
          const Icon = icons[toast.tone];
          return (
            <div
              key={toast.id}
              role="status"
              className={cn(
                "pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-2xl border px-5 py-4 shadow-lifted animate-fade-up",
                toneStyles[toast.tone],
              )}
            >
              <Icon className="size-6 shrink-0" aria-hidden="true" />
              <p className="flex-1 text-base font-medium">{toast.message}</p>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                aria-label="Dismiss notification"
                className="flex size-9 shrink-0 items-center justify-center rounded-lg opacity-60 transition-opacity hover:opacity-100"
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
