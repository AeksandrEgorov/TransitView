interface PageHeroProps {
  eyebrow: string;
  title: string;
  description: string;
}

function PageHero({ eyebrow, title, description }: PageHeroProps) {
  return (
    <section className="overflow-hidden rounded-[34px] bg-[#101a2d] px-6 py-8 text-white shadow-[0_20px_60px_rgba(15,23,42,0.18)] sm:px-8 lg:px-10">
      <div className="max-w-4xl">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-300">
          {eyebrow}
        </p>

        <h1 className="mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl">
          {title}
        </h1>

        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
          {description}
        </p>
      </div>
    </section>
  );
}

export default PageHero;