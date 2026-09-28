import { useState, useCallback } from "react";

export type ToastType = "success" | "error" | "info" | "warning";

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback(
    (message: string, type: ToastType = "info", duration = 3500) => {
      const id = Date.now().toString();
      setToasts((prev) => [...prev, { id, type, message, duration }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
      return id;
    },
    [],
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = {
    success: (msg: string, duration?: number) =>
      addToast(msg, "success", duration),
    error: (msg: string, duration?: number) => addToast(msg, "error", duration),
    info: (msg: string, duration?: number) => addToast(msg, "info", duration),
    warning: (msg: string, duration?: number) =>
      addToast(msg, "warning", duration),
  };

  return { toasts, toast, removeToast };
}
