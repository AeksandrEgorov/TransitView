import { useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import {
  Camera,
  Car,
  Home,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  Users,
} from "lucide-react";

import LogoutModal from "../components/modals/LogoutModal";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";

function DashboardLayout() {
  const { user, logoutUser } = useAuth();
  const { showToast } = useToast();

  const [isLogoutOpen, setIsLogoutOpen] = useState(false);

  const canManage =
    user?.role === "Andmebaasi_toimetaja" || user?.role === "Administraator";

  const isAdmin = user?.role === "Administraator";

  const navBaseClass =
    "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition";

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `${navBaseClass} ${
      isActive
        ? "bg-white text-slate-950 shadow-lg"
        : "text-slate-300 hover:bg-white/10 hover:text-white"
    }`;

  function openLogoutModal() {
    setIsLogoutOpen(true);
  }

  function closeLogoutModal() {
    setIsLogoutOpen(false);
  }

  function handleLogoutConfirm() {
    logoutUser();
    setIsLogoutOpen(false);

    showToast({
      variant: "info",
      title: "Välja logitud",
      message: "Oled edukalt kontolt välja logitud.",
    });
  }

  return (
    <>
      <div className="min-h-screen bg-slate-950 px-3 py-3 sm:px-5 sm:py-5">
        <div className="mx-auto flex min-h-[calc(100vh-24px)] w-full max-w-[1800px] flex-col overflow-hidden rounded-[32px] bg-white shadow-[0_24px_80px_rgba(0,0,0,0.35)] lg:min-h-[calc(100vh-40px)] lg:flex-row">
          <aside className="bg-slate-900 px-4 py-4 text-white lg:w-72 lg:px-5 lg:py-6">
            <div className="flex items-center justify-between gap-3 lg:block">
              <Link to="/" className="inline-flex items-center gap-3">
                <div>
                  <p className="text-lg font-extrabold text-white">
                    TransitView
                  </p>
                  <p className="text-xs font-semibold text-slate-400">
                    Töölaud
                  </p>
                </div>
              </Link>

              <button
                type="button"
                onClick={openLogoutModal}
                className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-3 py-2 text-sm font-bold text-white transition hover:bg-white/15 lg:hidden"
              >
                <LogOut size={17} />
                Välju
              </button>
            </div>

            <div className="mt-5 rounded-3xl bg-white/10 p-4 ring-1 ring-white/10">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-300">
                Kasutaja
              </p>

              <p className="mt-2 text-base font-bold text-white">
                {user?.username}
              </p>

              <p className="mt-1 text-xs font-semibold text-slate-300">
                {user?.role}
              </p>
            </div>

            <nav className="mt-5 space-y-6">
              <div>
                <p className="mb-2 px-4 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                  Minu ala
                </p>

                <div className="space-y-1">
                  <NavLink to="/dashboard" end className={navClass}>
                    <LayoutDashboard size={18} />
                    Ülevaade
                  </NavLink>

                  <NavLink to="/dashboard/vehicles" className={navClass}>
                    <Car size={18} />
                    Minu sõidukid
                  </NavLink>

                  <NavLink to="/dashboard/photos" className={navClass}>
                    <Camera size={18} />
                    Minu fotod
                  </NavLink>
                </div>
              </div>

              {canManage && (
                <div>
                  <p className="mb-2 px-4 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                    Haldus
                  </p>

                  <div className="space-y-1">
                    <NavLink
                      to="/dashboard/manage/vehicles"
                      className={navClass}
                    >
                      <ShieldCheck size={18} />
                      Sõidukid
                    </NavLink>

                    <NavLink
                      to="/dashboard/manage/photos"
                      className={navClass}
                    >
                      <Camera size={18} />
                      Fotod
                    </NavLink>

                    {isAdmin && (
                      <NavLink
                        to="/dashboard/manage/users"
                        className={navClass}
                      >
                        <Users size={18} />
                        Kasutajad
                      </NavLink>
                    )}
                  </div>
                </div>
              )}
            </nav>

            <div className="mt-6 hidden space-y-3 lg:block">
              <Link
                to="/"
                className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 px-4 py-3 text-sm font-bold text-slate-200 transition hover:bg-white/10 hover:text-white"
              >
                <Home size={17} />
                Avalehele
              </Link>

              <button
                type="button"
                onClick={openLogoutModal}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white/10 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/15"
              >
                <LogOut size={17} />
                Logi välja
              </button>
            </div>
          </aside>

          <main className="min-w-0 flex-1 bg-slate-100 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            <div className="mx-auto w-full max-w-7xl">
              <Outlet />
            </div>
          </main>
        </div>
      </div>

      <LogoutModal
        isOpen={isLogoutOpen}
        onClose={closeLogoutModal}
        onConfirm={handleLogoutConfirm}
      />
    </>
  );
}

export default DashboardLayout;