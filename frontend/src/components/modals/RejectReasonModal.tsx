import { XCircle } from "lucide-react";

import Modal from "../ui/Modal";
import RequiredLabel from "../ui/RequiredLabel";

interface Props {
  isOpen: boolean;
  title: string;
  message: string;
  comment: string;
  confirmLabel?: string;
  isLoading?: boolean;
  onCommentChange: (value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}

function RejectReasonModal({
  isOpen,
  title,
  message,
  comment,
  confirmLabel = "Lükka tagasi",
  isLoading = false,
  onCommentChange,
  onClose,
  onConfirm,
}: Props) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-rose-50 text-rose-600 ring-1 ring-rose-100">
        <XCircle size={28} />
      </div>

      <div className="mt-5">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-rose-600">
          Tagasilükkamine
        </p>

        <h2 className="mt-2 text-2xl font-bold text-slate-900">{title}</h2>

        <p className="mt-3 text-sm leading-6 text-slate-600">{message}</p>
      </div>

      <div className="mt-5">
        <RequiredLabel required>Kommentaar</RequiredLabel>

        <textarea
          value={comment}
          onChange={(event) => onCommentChange(event.target.value)}
          rows={5}
          placeholder="Kirjuta põhjus, miks kirje tagasi lükatakse..."
          className="w-full resize-none rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-rose-500 focus:ring-4 focus:ring-rose-100"
        />

        <p className="mt-2 text-xs leading-5 text-slate-500">
          Kommentaar kuvatakse kasutajale tema kirje juures.
        </p>
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
          disabled={isLoading || !comment.trim()}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-rose-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <XCircle size={17} />
          {isLoading ? "Salvestan..." : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

export default RejectReasonModal;