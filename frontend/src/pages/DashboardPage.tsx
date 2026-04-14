function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
          Töölaud
        </p>

        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          Kasutaja töölaud
        </h1>

        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
          Siia tuleb hiljem töölaud vaadetega Minu sõidukid, Minu fotod,
          modereerimine ja kasutajate haldus.
        </p>
      </div>

      <div className="rounded-3xl bg-slate-50 p-4 shadow-inner ring-1 ring-slate-200 sm:p-6">
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-slate-400">
          Töölaud placeholder
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;