import { useState } from "react";
import Modal from "../ui/Modal";
import { login } from "../../config/authApi";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../hooks/useToast";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

function LoginModal({ isOpen, onClose }: Props) {
  const { loginUser } = useAuth();
  const { showToast } = useToast();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setErrorMessage("");
      setIsSubmitting(true);

      const data = await login({ username, password });

      loginUser(data.token, data.user);

      showToast({
        variant: "success",
        title: "Sisselogimine õnnestus",
        message: `Tere tulemast tagasi, ${data.user.username}!`,
      });

      setUsername("");
      setPassword("");
      onClose();
    } catch (error) {
      console.error(error);
      setErrorMessage("Vale kasutajanimi või parool");

      showToast({
        variant: "error",
        title: "Sisselogimine ebaõnnestus",
        message: "Kontrolli kasutajanime ja parooli.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleClose() {
    if (isSubmitting) return;

    setErrorMessage("");
    onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <div className="space-y-5">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
            Sisselogimine
          </p>
          <h2 className="mt-2 text-2xl font-bold text-slate-900">
            Logi oma kontole sisse
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Sisesta oma kasutajanimi ja parool.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="username"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              Kasutajanimi
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              placeholder="Sisesta kasutajanimi"
              required
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              Parool
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              placeholder="Sisesta parool"
              required
            />
          </div>

          {errorMessage && (
            <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
              {errorMessage}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              disabled={isSubmitting}
            >
              Sulge
            </button>

            <button
              type="submit"
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Laeb..." : "Logi sisse"}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

export default LoginModal;