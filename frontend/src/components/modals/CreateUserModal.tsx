import { useEffect, useState } from "react";
import { Eye, EyeOff, ShieldCheck, UserPlus, X } from "lucide-react";

import {
  createManageUser,
  type ManageUserRole,
} from "../../config/manageApi";
import { useToast } from "../../hooks/useToast";

type AssignableRole = Exclude<ManageUserRole, "Administraator">;

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const roleOptions: Array<{
  value: AssignableRole;
  label: string;
  description: string;
}> = [
  {
    value: "Kasutaja",
    label: "Kasutaja",
    description: "Tavakasutaja saab lisada enda sõidukeid ja fotosid.",
  },
  {
    value: "Andmebaasi_toimetaja",
    label: "Andmebaasi toimetaja",
    description: "Toimetaja saab modereerida sõidukeid ja fotosid.",
  },
];

const initialForm = {
  username: "",
  email: "",
  password: "",
  role: "Kasutaja" as AssignableRole,
};

function CreateUserModal({ isOpen, onClose, onSuccess }: CreateUserModalProps) {
  const { showToast } = useToast();

  const [form, setForm] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setForm(initialForm);
      setShowPassword(false);
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  function updateField<K extends keyof typeof form>(
    key: K,
    value: (typeof form)[K]
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function validateForm() {
    if (!form.username.trim()) {
      return "Kasutajanimi on kohustuslik.";
    }

    if (form.username.trim().length < 3) {
      return "Kasutajanimi peab olema vähemalt 3 tähemärki.";
    }

    if (!form.email.trim()) {
      return "E-post on kohustuslik.";
    }

    if (!form.email.includes("@")) {
      return "E-posti formaat ei ole korrektne.";
    }

    if (!form.password.trim()) {
      return "Parool on kohustuslik.";
    }

    if (form.password.length < 8) {
      return "Parool peab olema vähemalt 8 tähemärki.";
    }


    return null;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const errorMessage = validateForm();

    if (errorMessage) {
      showToast({
        variant: "error",
        title: "Vigased andmed",
        message: errorMessage,
      });

      return;
    }

    try {
      setIsSubmitting(true);

      await createManageUser({
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
      });

      showToast({
        variant: "success",
        title: "Kasutaja loodud",
        message: `Kasutaja ${form.username.trim()} lisati edukalt.`,
      });

      onSuccess();
    } catch (error) {
      console.error(error);

      showToast({
        variant: "error",
        title: "Kasutaja loomine ebaõnnestus",
        message: "Kontrolli, kas kasutajanimi või e-post on juba kasutusel.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleClose() {
    if (isSubmitting) {
      return;
    }

    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 py-6"
      onClick={handleClose}
    >
      <div
        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-7"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-600">
              Kasutaja
            </p>

            <h2 className="mt-2 text-2xl font-extrabold text-slate-950">
              Lisa uus kasutaja
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Loo uus kasutajakonto ja määra talle sobiv roll.
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="rounded-2xl bg-slate-100 p-2 text-slate-500 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="text-sm font-bold text-slate-700">
                Kasutajanimi <span className="text-rose-500">*</span>
              </span>

              <input
                type="text"
                value={form.username}
                onChange={(event) =>
                  updateField("username", event.target.value)
                }
                className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                placeholder="nt kasutaja1"
              />
            </label>

            <label className="block">
              <span className="text-sm font-bold text-slate-700">
                E-post <span className="text-rose-500">*</span>
              </span>

              <input
                type="email"
                value={form.email}
                onChange={(event) => updateField("email", event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                placeholder="kasutaja@example.com"
              />
            </label>
          </div>

          <label className="block">
            <span className="text-sm font-bold text-slate-700">
              Parool <span className="text-rose-500">*</span>
            </span>

            <div className="mt-2 flex rounded-2xl border border-slate-300 bg-white focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100">
              <input
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(event) =>
                  updateField("password", event.target.value)
                }
                className="min-w-0 flex-1 rounded-2xl px-4 py-3 text-sm font-medium text-slate-800 outline-none"
                placeholder="vähemalt 8 tähemärki"
              />

              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="px-4 text-slate-500 transition hover:text-slate-800"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>

          <div>
            <span className="text-sm font-bold text-slate-700">
              Roll <span className="text-rose-500">*</span>
            </span>

            <div className="mt-2 grid gap-3 md:grid-cols-2">
              {roleOptions.map((role) => (
                <button
                  key={role.value}
                  type="button"
                  onClick={() => updateField("role", role.value)}
                  className={`rounded-2xl border p-4 text-left transition ${
                    form.role === role.value
                      ? "border-blue-500 bg-blue-50 ring-4 ring-blue-100"
                      : "border-slate-200 bg-white hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-2xl ${
                        form.role === role.value
                          ? "bg-blue-600 text-white"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      <ShieldCheck size={18} />
                    </div>

                    <div>
                      <p className="text-sm font-extrabold text-slate-950">
                        {role.label}
                      </p>

                      <p className="mt-1 text-xs font-medium text-slate-500">
                        {role.description}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <p className="mt-3 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700 ring-1 ring-amber-100">
              Administraatori rolli ei saa siin määrata.
            </p>
          </div>

          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="inline-flex items-center justify-center rounded-2xl border border-slate-300 px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Tühista
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <UserPlus size={18} />
              {isSubmitting ? "Salvestan..." : "Lisa kasutaja"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateUserModal;