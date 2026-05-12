import DashboardPageHeader from "../../../components/dashboard/DashboardPageHeader";

function ManageVehiclesPage() {
  return (
    <div className="space-y-6">
      <DashboardPageHeader
        eyebrow="Haldus"
        title="Sõidukite haldus"
        description="Siin saab vaadata, muuta, kustutada ja modereerida kasutajate lisatud sõidukeid."
      />

      <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <p className="text-sm text-slate-500">
          Siia tuleb sõidukite modereerimine ja haldus.
        </p>
      </section>
    </div>
  );
}

export default ManageVehiclesPage;