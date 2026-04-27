import PageHero from "../components/ui/PageHero";

function GalleryPage() {
  return (
    <div className="space-y-8">
      <PageHero
        eyebrow="Galerii"
        title="Fotogalerii"
        description="Siia tuleb kinnitatud fotode galerii koos filtrite, asukoha valiku ja paginationiga."
      />

      <div className="rounded-[30px] border border-dashed border-slate-300 bg-white p-8 text-slate-500 shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
        Galerii sisu placeholder
      </div>
    </div>
  );
}

export default GalleryPage;