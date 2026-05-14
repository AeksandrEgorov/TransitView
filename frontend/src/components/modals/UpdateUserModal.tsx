import { useEffect, useState } from "react";
import { Eye, EyeOff, ShieldCheck, X } from "lucide-react";

import {
  updateManageUser,
  type ManageUserOption,
  type ManageUserRole,
} from "../../config/manageApi";
import { useToast } from "../../hooks/useToast";

type AssignableRole = Exclude<ManageUserRole, "Administraator">;

interface UpdateUserModalProps {
  isOpen: boolean;
  user: ManageUserOption | null;
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

function getSafeRole(role?: ManageUserRole | string | null): AssignableRole {
  if (role === "Andmebaasi_toimetaja") {
    return "Andmebaasi_toimetaja";
  }

  return "Kasutaja";
}

function UpdateUserModal({
  isOpen,
  user,
  onClose,
  onSuccess,
}: UpdateUserModalProps) {
  const { showToast } = useToast();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<AssignableRole>("Kasutaja");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isAdmin = user?.role === "Administraator";

  useEffect(() => {
    if (isOpen && user) {
      setUsername(user.username ?? "");
      setEmail(user.email ?? "");
      setPassword("");
      setRole(getSafeRole(user.role));
      setShowPassword(false);
    }
  }, [isOpen, user]);

  if (!isOpen || !user) {
    return null;
  }

  function validateForm() {
    if (isAdmin) {
      return "Administraatori kontot ei saa muuta.";
    }

    if (!username.trim()) {
      return "Kasutajanimi on kohustuslik.";
    }

    if (username.trim().length < 3) {
      return "Kasutajanimi peab olema vähemalt 3 tähemärki.";
    }

    if (!email.trim()) {
      return "E-post on kohustuslik.";
    }

    if (!email.includes("@")) {
      return "E-posti formaat ei ole korrektne.";
    }

    if (password && password.length < 8) {
      return "Uus parool peab olema vähemalt 8 tähemärki.";
    }


    return null;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user) {
        return;
    }

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

      await updateManageUser(user.user_id, {
        username: username.trim(),
        email: email.trim(),
        role,
        ...(password ? { password } : {}),
      });

      showToast({
        variant: "success",
        title: "Kasutaja uuendatud",
        message: `Kasutaja ${username.trim()} andmed uuendati edukalt.`,
      });

      onSuccess();
    } catch (error) {
      console.error(error);

      showToast({
        variant: "error",
        title: "Kasutaja muutmine ebaõnnestus",
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
              Muuda kasutajat
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Uuenda kasutaja põhiandmeid ja rolli.
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

        {isAdmin ? (
          <div className="rounded-2xl bg-rose-50 p-4 text-sm font-semibold text-rose-700 ring-1 ring-rose-100">
            Administraatori kontot ei saa muuta. See kaitseb projekti
            peamist haldusrolli.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="text-sm font-bold text-slate-700">
                  Kasutajanimi <span className="text-rose-500">*</span>
                </span>

                <input
                  type="text"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </label>

              <label className="block">
                <span className="text-sm font-bold text-slate-700">
                  E-post <span className="text-rose-500">*</span>
                </span>

                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </label>
            </div>

            <label className="block">
              <span className="text-sm font-bold text-slate-700">
                Uus parool
              </span>

              <div className="mt-2 flex rounded-2xl border border-slate-300 bg-white focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="min-w-0 flex-1 rounded-2xl px-4 py-3 text-sm font-medium text-slate-800 outline-none"
                  placeholder="jäta tühjaks, kui parooli ei muuda"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="px-4 text-slate-500 transition hover:text-slate-800"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <p className="mt-2 text-xs font-medium text-slate-500">
                Kui väli jääb tühjaks, siis parooli ei muudeta.
              </p>
            </label>

            <div>
              <span className="text-sm font-bold text-slate-700">
                Roll <span className="text-rose-500">*</span>
              </span>

              <div className="mt-2 grid gap-3 md:grid-cols-2">
                {roleOptions.map((roleOption) => (
                  <button
                    key={roleOption.value}
                    type="button"
                    onClick={() => setRole(roleOption.value)}
                    className={`rounded-2xl border p-4 text-left transition ${
                      role === roleOption.value
                        ? "border-blue-500 bg-blue-50 ring-4 ring-blue-100"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-2xl ${
                          role === roleOption.value
                            ? "bg-blue-600 text-white"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        <ShieldCheck size={18} />
                      </div>

                      <div>
                        <p className="text-sm font-extrabold text-slate-950">
                          {roleOption.label}
                        </p>

                        <p className="mt-1 text-xs font-medium text-slate-500">
                          {roleOption.description}
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
                className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? "Salvestan..." : "Salvesta muudatused"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default UpdateUserModal;