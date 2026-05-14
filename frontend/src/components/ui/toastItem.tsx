// This file has the toast item component.

import { useEffect, useState } from "react";
import type { ToastItem as ToastItemType } from "../../types/toast";

interface Props {
  toast: ToastItemType;
  onRemove: (id: string) => void;
}

function ToastItem({ toast, onRemove }: Props) {
  const [isVisible, setIsVisible] = useState(false);
  const duration = toast.duration ?? 5000;

  useEffect(() => {
    const enterTimer = window.setTimeout(() => {
      setIsVisible(true);
    }, 20);

    const hideTimer = window.setTimeout(() => {
      setIsVisible(false);
    }, duration - 300);

    const removeTimer = window.setTimeout(() => {
      onRemove(toast.id);
    }, duration);

    return () => {
      window.clearTimeout(enterTimer);
      window.clearTimeout(hideTimer);
      window.clearTimeout(removeTimer);
    };
  }, [duration, onRemove, toast.id]);

  function getAccentClass() {
    if (toast.variant === "error") {
      return "border-red-500";
    }

    return "border-blue-600";
  }

  function getBarClass() {
    if (toast.variant === "error") {
      return "bg-red-500";
    }

    return "bg-blue-500";
  }

  return (
    <div
      className={`w-full max-w-md overflow-hidden rounded-2xl border-l-4 bg-white shadow-[0_12px_35px_rgba(15,23,42,0.18)] ring-1 ring-slate-200 transition-all duration-300 ${
        getAccentClass()
      } ${
        isVisible
          ? "translate-y-0 opacity-100"
          : "-translate-y-3 opacity-0"
      }`}
    >
      <div className="px-4 py-3 sm:px-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900">{toast.title}</p>

            {toast.message && (
              <p className="mt-1 text-sm leading-5 text-slate-600">
                {toast.message}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={() => onRemove(toast.id)}
            className="shrink-0 rounded-lg px-2 py-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            aria-label="Sulge teavitus"
          >
            ×
          </button>
        </div>
      </div>

      <div className="h-1 w-full bg-slate-100">
        <div
          className={`h-full ${getBarClass()}`}
          style={{
            width: "100%",
            animation: `toast-progress ${duration}ms linear forwards`,
          }}
        />
      </div>
    </div>
  );
}

export default ToastItem;