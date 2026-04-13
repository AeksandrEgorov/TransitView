import { NavLink } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

function Header() {
  const { user, isAuthenticated, logoutUser } = useAuth();

  const linkClass =
    "px-3 py-1.5 rounded-md text-sm font-medium transition";

  const activeClass = "bg-blue-500 text-white";
  const inactiveClass =
    "text-slate-300 hover:bg-slate-700 hover:text-white";

  return (
    <header className="bg-slate-900 shadow-md">
      <div className="max-w-7xl mx-auto flex justify-between items-center p-4">
        {/* LOGO */}
        <NavLink
          to="/"
          className="text-xl font-semibold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent"
        >
          TransitView
        </NavLink>

        {/* NAV */}
        <nav className="flex gap-2 items-center">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `${linkClass} ${isActive ? activeClass : inactiveClass}`
            }
          >
            Home
          </NavLink>

          <NavLink
            to="/gallery"
            className={({ isActive }) =>
              `${linkClass} ${isActive ? activeClass : inactiveClass}`
            }
          >
            Gallery
          </NavLink>

          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `${linkClass} ${isActive ? activeClass : inactiveClass}`
            }
          >
            Dashboard
          </NavLink>

          {/* AUTH */}
          {isAuthenticated ? (
            <>
              <span className="text-sm text-slate-300 px-2">
                {user?.username}
              </span>

              <button
                onClick={logoutUser}
                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-md text-sm transition"
              >
                Logout
              </button>
            </>
          ) : (
            <button className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-md text-sm transition">
              Login
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}

export default Header;