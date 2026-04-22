import Modal from "../ui/Modal";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

function LogoutModal({ isOpen, onClose, onConfirm }: Props) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="space-y-5">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
            Kinnitus
          </p>

          <h2 className="mt-2 text-2xl font-bold text-slate-900">
            Kas soovid välja logida?
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Pärast väljalogimist pead uuesti sisse logima, et töölauda kasutada.
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Tühista
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className="rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600"
          >
            Logi välja
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default LogoutModal;