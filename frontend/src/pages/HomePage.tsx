function HomePage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
          Avaleht
        </p>

        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          Transpordiandmebaas
        </h1>

        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
          Siia tuleb kinnitatud sõidukite avalik loend koos filtrite,
          paginationi ja kaartidega.
        </p>
      </div>

      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-slate-500">
        Avalehe sisu placeholder
      </div>
    </div>
  );
}

export default HomePage;