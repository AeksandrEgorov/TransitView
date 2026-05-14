// This file has the toast container component.

import ToastItem from "./ToastItem";
import type { ToastItem as ToastItemType } from "../../types/toast";

interface Props {
  toasts: ToastItemType[];
  onRemove: (id: string) => void;
}

function ToastContainer({ toasts, onRemove }: Props) {
  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex justify-center px-4">
      <div className="pointer-events-auto flex w-full max-w-md flex-col gap-3">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
        ))}
      </div>
    </div>
  );
}

export default ToastContainer;
