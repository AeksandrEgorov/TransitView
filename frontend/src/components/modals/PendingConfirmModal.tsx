import Modal from "../ui/Modal";

interface Props {
  isOpen: boolean;
  title?: string;
  message?: string;
  confirmLabel?: string;
  isLoading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

function PendingConfirmModal({
  isOpen,
  title = "Pane ootele",
  message = "Kas oled kindel, et soovid selle kirje tagasi ootele panna?",
  confirmLabel = "Pane ootele",
  isLoading = false,
  onClose,
  onConfirm,
}: Props) {
  function handleClose() {
    if (isLoading) {
      return;
    }

    onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="sm">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-amber-600">
          Modereerimine
        </p>

        <h2 className="mt-2 text-2xl font-bold text-slate-900">{title}</h2>

        <p className="mt-3 text-sm leading-6 text-slate-600">{message}</p>

        <div className="mt-5 rounded-2xl bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800 ring-1 ring-amber-100">
          Kirje staatus muudetakse tagasi väärtuseks{" "}
          <span className="font-bold">Ootel</span>. Varasem modereerimise
          kommentaar ja ülevaatamise aeg eemaldatakse.
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={handleClose}
            disabled={isLoading}
            className="rounded-2xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Tühista
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="rounded-2xl bg-amber-500 px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(245,158,11,0.22)] transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isLoading ? "Muudan..." : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default PendingConfirmModal;