import { AlertTriangle, Trash2, X } from "lucide-react";

import Modal from "../ui/Modal";

interface Props {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

function DeleteConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = "Kustuta",
  cancelLabel = "Tühista",
  isLoading = false,
  onClose,
  onConfirm,
}: Props) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <div className="relative">
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="absolute right-0 top-0 flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
          aria-label="Sulge"
        >
          <X size={18} />
        </button>

        <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-rose-50 text-rose-600 ring-1 ring-rose-100">
          <AlertTriangle size={26} />
        </div>

        <h2 className="mt-5 pr-12 text-2xl font-extrabold text-slate-950">
          {title}
        </h2>

        <p className="mt-3 max-w-xl text-sm leading-7 text-slate-600">
          {message}
        </p>

        <div className="mt-6 rounded-2xl bg-rose-50 p-4 text-sm font-medium leading-6 text-rose-700 ring-1 ring-rose-100">
          Seda tegevust ei saa tagasi võtta.
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="rounded-2xl border border-slate-300 px-6 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-rose-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <Trash2 size={17} />
            {isLoading ? "Kustutan..." : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default DeleteConfirmModal;