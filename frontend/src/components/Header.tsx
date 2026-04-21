import { useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import LoginModal from "./modals/LoginModal";

function Header() {
  const { user, isAuthenticated, logoutUser } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  const navBaseClass =
    "rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-200";

  const closeMenu = () => setIsMenuOpen(false);

  function openLoginModal() {
    setIsLoginOpen(true);
    closeMenu();
  }

  function closeLoginModal() {
    setIsLoginOpen(false);
  }

  return (
    <>
      <header className="text-white">
        <div className="w-full px-3 pt-5 sm:px-5 lg:px-8">
          <div className="mx-auto w-full max-w-[1700px] rounded-t-[28px] bg-[#1e2c44] px-4 py-4 shadow-[0_10px_30px_rgba(2,6,23,0.25)] sm:px-6">
            <div className="flex items-center justify-between gap-4">
              <NavLink
                to="/"
                onClick={closeMenu}
                className="text-2xl font-extrabold tracking-tight text-white"
              >
                TransitView
              </NavLink>

              <nav className="hidden md:flex md:items-center md:gap-2">
                <NavLink
                  to="/"
                  className={({ isActive }) =>
                    `${navBaseClass} ${
                      isActive
                        ? "bg-slate-900 text-white shadow-inner"
                        : "text-slate-200 hover:bg-white/8 hover:text-white"
                    }`
                  }
                >
                  Avaleht
                </NavLink>

                <NavLink
                  to="/gallery"
                  className={({ isActive }) =>
                    `${navBaseClass} ${
                      isActive
                        ? "bg-slate-900 text-white shadow-inner"
                        : "text-slate-200 hover:bg-white/8 hover:text-white"
                    }`
                  }
                >
                  Galerii
                </NavLink>

                <NavLink
                  to="/rules"
                  className={({ isActive }) =>
                    `${navBaseClass} ${
                      isActive
                        ? "bg-slate-900 text-white shadow-inner"
                        : "text-slate-200 hover:bg-white/8 hover:text-white"
                    }`
                  }
                >
                  Reeglid
                </NavLink>

                {isAuthenticated && (
                  <NavLink
                    to="/dashboard"
                    className={({ isActive }) =>
                      `${navBaseClass} ${
                        isActive
                          ? "bg-slate-900 text-white shadow-inner"
                          : "text-slate-200 hover:bg-white/8 hover:text-white"
                      }`
                    }
                  >
                    Töölaud
                  </NavLink>
                )}
              </nav>

              <div className="hidden md:flex md:items-center md:gap-3">
                <div className="h-9 w-px bg-white/10" />

                {isAuthenticated ? (
                  <div className="flex items-center gap-3">
                    <div className="hidden lg:flex lg:flex-col lg:items-end">
                      <span className="text-sm font-semibold text-white">
                        {user?.username}
                      </span>
                      <span className="text-xs text-slate-300">
                        {user?.role}
                      </span>
                    </div>

                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-700 text-sm font-bold text-white ring-2 ring-white/10">
                      {user?.username?.[0]?.toUpperCase() ?? "U"}
                    </div>

                    <button
                      onClick={logoutUser}
                      className="rounded-xl bg-white/8 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-500 hover:text-white"
                    >
                      Logi välja
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={openLoginModal}
                    className="rounded-xl bg-[#0f172a] px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
                  >
                    Logi sisse
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setIsMenuOpen((prev) => !prev)}
                className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 md:hidden"
                aria-label="Ava menüü"
              >
                ☰
              </button>
            </div>

            <div className="mt-4 h-px bg-white/10" />

            {isMenuOpen && (
              <div className="mt-4 flex flex-col gap-2 md:hidden">
                <NavLink
                  to="/"
                  onClick={closeMenu}
                  className={({ isActive }) =>
                    `${navBaseClass} ${
                      isActive
                        ? "bg-slate-900 text-white"
                        : "bg-white/5 text-slate-200 hover:bg-white/10"
                    }`
                  }
                >
                  Avaleht
                </NavLink>

                <NavLink
                  to="/gallery"
                  onClick={closeMenu}
                  className={({ isActive }) =>
                    `${navBaseClass} ${
                      isActive
                        ? "bg-slate-900 text-white"
                        : "bg-white/5 text-slate-200 hover:bg-white/10"
                    }`
                  }
                >
                  Galerii
                </NavLink>
                
                <NavLink
                  to="/rules"
                  onClick={closeMenu}
                  className={({ isActive }) =>
                    `${navBaseClass} ${
                      isActive
                        ? "bg-slate-900 text-white"
                        : "bg-white/5 text-slate-200 hover:bg-white/10"
                    }`
                  }
                >
                  Reeglid
                </NavLink>

                {isAuthenticated && (
                  <NavLink
                    to="/dashboard"
                    onClick={closeMenu}
                    className={({ isActive }) =>
                      `${navBaseClass} ${
                        isActive
                          ? "bg-slate-900 text-white"
                          : "bg-white/5 text-slate-200 hover:bg-white/10"
                      }`
                    }
                  >
                    Töölaud
                  </NavLink>
                )}

                <div className="my-2 h-px bg-white/10" />

                {isAuthenticated ? (
                  <>
                    <div className="rounded-xl bg-white/5 px-4 py-3">
                      <p className="text-sm font-semibold text-white">
                        {user?.username}
                      </p>
                      <p className="text-xs text-slate-300">{user?.role}</p>
                    </div>

                    <button
                      onClick={() => {
                        logoutUser();
                        closeMenu();
                      }}
                      className="rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600"
                    >
                      Logi välja
                    </button>
                  </>
                ) : (
                  <button
                    onClick={openLoginModal}
                    className="rounded-xl bg-blue-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-600"
                  >
                    Logi sisse
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      <LoginModal isOpen={isLoginOpen} onClose={closeLoginModal} />
    </>
  );
}

export default Header;