// This file has the dashboard page header component.

interface Props {
  eyebrow: string;
  title: string;
  description?: string;
}

function DashboardPageHeader({ eyebrow, title, description }: Props) {
  return (
    <section className="rounded-[32px] bg-slate-950 p-7 text-white shadow-[0_24px_70px_rgba(15,23,42,0.18)]">
      <p className="text-sm font-bold uppercase tracking-[0.22em] text-blue-300">
        {eyebrow}
      </p>

      <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
        {title}
      </h1>

      {description && (
        <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-slate-300">
          {description}
        </p>
      )}
    </section>
  );
}

export default DashboardPageHeader;