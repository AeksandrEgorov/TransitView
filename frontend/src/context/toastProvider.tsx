import { useCallback, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { ToastContext } from "./toast-сontext";
import type { ToastItem } from "../types/toast";
import ToastContainer from "../components/ui/toastContainer";

function generateToastId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (toast: Omit<ToastItem, "id">) => {
      const id = generateToastId();

      setToasts((prev) => [
        ...prev,
        {
          id,
          duration: 5000,
          ...toast,
        },
      ]);
    },
    []
  );

  const value = useMemo(
    () => ({
      showToast,
      removeToast,
    }),
    [showToast, removeToast]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}