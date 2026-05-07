import {
  BarChart3,
  BusFront,
  Images,
  MapPin,
  Tags,
} from "lucide-react";

import type { PublicStats } from "../../config/statsApi";

interface Props {
  stats: PublicStats | null;
  isLoading?: boolean;
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 text-blue-600">{icon}</div>

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
            {label}
          </p>

          <p className="mt-1 text-2xl font-extrabold text-slate-900">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

function PublicStatsSection({ stats, isLoading = false }: Props) {
  return (
    <section className="rounded-[28px] bg-white px-5 py-5 shadow-[0_14px_40px_rgba(15,23,42,0.06)] ring-1 ring-slate-200/80 sm:px-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <BarChart3 size={21} />
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-600">
              Statistika
            </p>

            <h2 className="mt-1 text-xl font-bold text-slate-900">
              Avalikud andmed
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Siin kuvatakse ainult kinnitatud ja avalikult nähtavad andmed.
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[560px] lg:grid-cols-4">
          {isLoading ? (
            <>
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="h-[78px] animate-pulse rounded-2xl bg-slate-100 ring-1 ring-slate-200"
                />
              ))}
            </>
          ) : stats ? (
            <>
              <StatCard
                label="Sõidukeid"
                value={stats.vehiclesTotal}
                icon={<BusFront size={20} />}
              />

              <StatCard
                label="Fotosid"
                value={stats.photosTotal}
                icon={<Images size={20} />}
              />

              <StatCard
                label="Kategooriaid"
                value={stats.categoriesTotal}
                icon={<Tags size={20} />}
              />

              <StatCard
                label="Linnu"
                value={stats.citiesTotal}
                icon={<MapPin size={20} />}
              />
            </>
          ) : (
            <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 ring-1 ring-red-100 sm:col-span-2 lg:col-span-4">
              Statistikat ei õnnestunud laadida.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default PublicStatsSection;