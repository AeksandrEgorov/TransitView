import PageHero from "../components/ui/PageHero";

function DashboardPage() {
  return (
    <div className="space-y-8">
      <PageHero
        eyebrow="Töölaud"
        title="Kasutaja töölaud"
        description="Siin saab kasutaja hallata oma sõidukikaarte ja fotosid, jälgida modereerimise staatust ning lisada vajadusel uusi fotosid."
      />

      <div className="rounded-[30px] bg-white p-6 shadow-[0_14px_40px_rgba(15,23,42,0.07)] ring-1 ring-slate-200/80">
        <div className="min-h-[360px] rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-slate-400">
          Töölaud placeholder
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;