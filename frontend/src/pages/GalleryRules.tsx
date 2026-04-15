function GalleryRules() {
    return (
        <div className="space-y-6">
        <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
            Reeglid
            </p>

            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Fotode lisamise reeglid
            </h1>

            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
            TransitView galerii kvaliteedi tagamiseks peavad kõik üleslaaditud fotod vastama järgmistele nõuetele.
            </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
            {rules.map((rule) => (
            <div 
                key={rule.id} 
                className={`rounded-2xl border p-6 transition-all ${
                rule.isAllowed 
                    ? 'border-emerald-100 bg-emerald-50/30' 
                    : 'border-rose-100 bg-rose-50/30'
                }`}
            >
                <div className="flex items-start gap-3">
                <span className="text-lg">{rule.isAllowed ? 'Jah' : 'Ei'}</span>
                <div>
                    <h3 className={`font-bold ${rule.isAllowed ? 'text-emerald-900' : 'text-rose-900'}`}>
                    {rule.title}
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-slate-600">
                    {rule.description}
                    </p>
                </div>
                </div>
            </div>
            ))}
        </div>
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
            <p className="text-sm text-slate-500">
            Küsimuste korral võtke ühendust administratsiooniga.
            </p>
        </div>
        </div>
    );
}
export default GalleryRules