import { BarChart3, BusFront, Images, MapPin, Tags } from "lucide-react";
import type { ReactNode } from "react";

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
  icon: ReactNode;
}) {
  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-slate-400">
            {label}
          </p>

          <p className="mt-2 text-3xl font-extrabold text-slate-950">
            {value}
          </p>
        </div>

        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
          {icon}
        </div>
      </div>
    </div>
  );
}

function PublicStatsSection({ stats, isLoading = false }: Props) {
  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <div className="mb-5 flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
          <BarChart3 size={24} />
        </div>

        <div>
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-blue-600">
            Statistika
          </p>

          <h2 className="mt-2 text-2xl font-extrabold text-slate-950">
            Avalikud andmed
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Siin kuvatakse ainult kinnitatud ja avalikult nähtavad andmed.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-32 animate-pulse rounded-3xl bg-slate-100"
            />
          ))}
        </div>
      ) : stats ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Sõidukeid"
            value={stats.vehiclesTotal}
            icon={<BusFront size={24} />}
          />

          <StatCard
            label="Fotosid"
            value={stats.photosTotal}
            icon={<Images size={24} />}
          />

          <StatCard
            label="Kategooriaid"
            value={stats.categoriesTotal}
            icon={<Tags size={24} />}
          />

          <StatCard
            label="Linnu"
            value={stats.citiesTotal}
            icon={<MapPin size={24} />}
          />
        </div>
      ) : (
        <p className="rounded-2xl bg-slate-50 p-4 text-sm font-medium text-slate-500">
          Statistikat ei õnnestunud laadida.
        </p>
      )}
    </section>
  );
}

export default PublicStatsSection;