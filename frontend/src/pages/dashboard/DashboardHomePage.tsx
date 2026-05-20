// This page is the main dashboard landing screen.
// It loads user stats, manage stats when allowed, and quick links for the most common tasks.

import { Link } from "react-router-dom";
import { Camera, Car, ShieldCheck, Users } from "lucide-react";

import { useAuth } from "../../hooks/useAuth";

function DashboardHomePage() {
  const { user } = useAuth();

  const canManage =
    user?.role === "Andmebaasi_toimetaja" || user?.role === "Administraator";

  const isAdmin = user?.role === "Administraator";

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] bg-slate-950 p-7 text-white shadow-[0_24px_70px_rgba(15,23,42,0.18)]">
        <p className="text-sm font-bold uppercase tracking-[0.22em] text-blue-300">
          Töölaud
        </p>

        <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
          Tere, {user?.username}
        </h1>

        <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-slate-300">
          Siit saad hallata enda lisatud sõidukeid ja fotosid. Kui sul on
          toimetaja või administraatori roll, näed ka halduse ja modereerimise
          tööriistu.
        </p>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        <Link
          to="/dashboard/vehicles"
          className="rounded-3xl bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)] ring-1 ring-slate-200 transition hover:-translate-y-1 hover:shadow-[0_22px_60px_rgba(15,23,42,0.12)]"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <Car size={24} />
          </div>

          <h2 className="mt-5 text-xl font-extrabold text-slate-950">
            Minu sõidukid
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Vaata enda lisatud sõidukeid ja nende staatust.
          </p>
        </Link>

        <Link
          to="/dashboard/photos"
          className="rounded-3xl bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)] ring-1 ring-slate-200 transition hover:-translate-y-1 hover:shadow-[0_22px_60px_rgba(15,23,42,0.12)]"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <Camera size={24} />
          </div>

          <h2 className="mt-5 text-xl font-extrabold text-slate-950">
            Minu fotod
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Vaata enda lisatud fotosid ja vajadusel muuda ootel kirjeid.
          </p>
        </Link>

        {canManage && (
          <Link
            to="/dashboard/manage/vehicles"
            className="rounded-3xl bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)] ring-1 ring-slate-200 transition hover:-translate-y-1 hover:shadow-[0_22px_60px_rgba(15,23,42,0.12)]"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <ShieldCheck size={24} />
            </div>

            <h2 className="mt-5 text-xl font-extrabold text-slate-950">
              Haldus
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Modereeri sõidukeid ja fotosid.
            </p>
          </Link>
        )}

        {isAdmin && (
          <Link
            to="/dashboard/manage/users"
            className="rounded-3xl bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)] ring-1 ring-slate-200 transition hover:-translate-y-1 hover:shadow-[0_22px_60px_rgba(15,23,42,0.12)]"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
              <Users size={24} />
            </div>

            <h2 className="mt-5 text-xl font-extrabold text-slate-950">
              Kasutajad
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Halda kasutajaid ja rolle.
            </p>
          </Link>
        )}
      </section>
    </div>
  );
}

export default DashboardHomePage;
