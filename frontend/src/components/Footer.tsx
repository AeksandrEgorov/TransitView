import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="bg-[#1e2c44] text-slate-300">
      <div className="w-full px-3 pb-5 sm:px-5 lg:px-8">
        <div className="mx-auto flex w-full max-w-[1700px] flex-col gap-4 border-t border-white/10 px-4 pt-5 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <Link
            to="/"
            className="text-lg font-extrabold tracking-tight text-white transition hover:opacity-85"
          >
            TransitView
          </Link>

          <p className="text-slate-400">
            © 2026 TransitView. Kõik õigused kaitstud.
          </p>

          <div className="flex gap-4">
            <Link
              to="/rules"
              className="font-medium text-slate-300 transition hover:text-white"
            >
              Reeglid
            </Link>

            <Link
              to="/contacts"
              className="font-medium text-slate-300 transition hover:text-white"
            >
              Kontaktid
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;