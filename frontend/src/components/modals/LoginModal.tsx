import { useState } from "react";
import type { FormEvent } from "react";

import Modal from "../ui/Modal";
import RequiredLabel from "../ui/RequiredLabel";
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setErrorMessage("");
      setIsSubmitting(true);

      const data = await login({
        username,
        password,
      });

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
    if (isSubmitting) {
      return;
    }

    setErrorMessage("");
    onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-600">
          Sisselogimine
        </p>

        <h2 className="mt-2 text-2xl font-bold text-slate-900">
          Logi oma kontole sisse
        </h2>

        <p className="mt-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600 ring-1 ring-slate-200">
          Sisesta oma kasutajanimi ja parool.
        </p>

        <p className="mt-3 text-xs text-slate-500">
          Tärniga <span className="font-bold text-red-500">*</span> märgitud
          väljad on kohustuslikud.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5" lang="et-EE">
        <div>
          <RequiredLabel required>Kasutajanimi</RequiredLabel>

          <input
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="Sisesta kasutajanimi"
            className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
            required
          />
        </div>

        <div>
          <RequiredLabel required>Parool</RequiredLabel>

          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Sisesta parool"
            className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
            required
          />
        </div>

        {errorMessage && (
          <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 ring-1 ring-red-100">
            {errorMessage}
          </p>
        )}

        <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="rounded-2xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Sulge
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(37,99,235,0.22)] transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "Laeb..." : "Logi sisse"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default LoginModal;