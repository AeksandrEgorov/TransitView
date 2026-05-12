import DashboardPageHeader from "../../../components/dashboard/DashboardPageHeader";

function ManageUsersPage() {
  return (
    <div className="space-y-6">
      <DashboardPageHeader
        eyebrow="Admin"
        title="Kasutajad"
        description="Siin saab administraator hallata kasutajakontosid ja rolle."
      />

      <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <p className="text-sm text-slate-500">
          Siia tuleb kasutajate haldus.
        </p>
      </section>
    </div>
  );
}

export default ManageUsersPage;