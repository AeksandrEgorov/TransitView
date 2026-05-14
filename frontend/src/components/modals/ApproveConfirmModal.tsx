import { CheckCircle2 } from "lucide-react";

import Modal from "../ui/Modal";

interface Props {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  isLoading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

function ApproveConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = "Kinnita",
  isLoading = false,
  onClose,
  onConfirm,
}: Props) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
        <CheckCircle2 size={28} />
      </div>

      <div className="mt-5">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-600">
          Kinnitamine
        </p>

        <h2 className="mt-2 text-2xl font-bold text-slate-900">{title}</h2>

        <p className="mt-3 text-sm leading-6 text-slate-600">{message}</p>
      </div>

      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="rounded-2xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Tühista
        </button>

        <button
          type="button"
          onClick={onConfirm}
          disabled={isLoading}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <CheckCircle2 size={17} />
          {isLoading ? "Kinnitan..." : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

export default ApproveConfirmModal;