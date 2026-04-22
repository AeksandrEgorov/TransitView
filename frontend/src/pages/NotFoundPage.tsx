import { Link } from "react-router-dom";

function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
        404
      </p>

      <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
        Lehte ei leitud
      </h1>

      <p className="mt-4 max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
        Otsitud lehekülge ei ole olemas või see on teisaldatud.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          to="/"
          className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          Tagasi avalehele
        </Link>

        <Link
          to="/gallery"
          className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
        >
          Ava galerii
        </Link>
      </div>
    </div>
  );
}

export default NotFoundPage;