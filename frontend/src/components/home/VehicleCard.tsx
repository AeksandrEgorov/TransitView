import type { VehicleItem } from "../../types/vehicle";
import { formatVehicleCondition } from "../../utils/formatters";

interface Props {
  vehicle: VehicleItem;
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("et-EE");
}

function getConditionBadgeClass(condition: VehicleItem["condition"]) {
  if (condition === "Töökorras") {
    return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  }

  if (condition === "Ei_tööta") {
    return "bg-amber-50 text-amber-700 ring-amber-200";
  }

  if (condition === "Maha_kantud") {
    return "bg-rose-50 text-rose-700 ring-rose-200";
  }

  if (condition === "Müüdud") {
    return "bg-violet-50 text-violet-700 ring-violet-200";
  }

  return "bg-slate-100 text-slate-700 ring-slate-200";
}

function VehicleCard({ vehicle }: Props) {
  const imageUrl =
    vehicle.photos[0]?.file_path ||
    "https://placehold.co/800x500/e2e8f0/475569?text=TransitView";

  const firstPhoto = vehicle.photos[0];

  const locationLabel = vehicle.branch
    ? `${vehicle.branch.city.name}, ${vehicle.branch.city.county.name}`
    : firstPhoto?.city
    ? `${firstPhoto.city.name}, ${firstPhoto.city.county.name}`
    : "Asukoht teadmata";

  const companyLabel = vehicle.branch?.company.name ?? "Ettevõte teadmata";

  return (
    <article className="group overflow-hidden rounded-3xl bg-white shadow-[0_18px_50px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/70 transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_60px_rgba(15,23,42,0.12)]">
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-200">
        <img
          src={imageUrl}
          alt={vehicle.reg_number}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
        />

        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-4">
          <span className="rounded-full bg-slate-950/75 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
            {vehicle.model.category.name}
          </span>

          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 backdrop-blur ${getConditionBadgeClass(
              vehicle.condition
            )}`}
          >
            {formatVehicleCondition(vehicle.condition)}
          </span>
        </div>

        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/85 via-slate-950/35 to-transparent px-4 pb-4 pt-10">
          <p className="text-lg font-bold text-white">{vehicle.reg_number}</p>
          <p className="text-sm text-slate-200">
            {vehicle.model.manufacturer} {vehicle.model.name}
          </p>
        </div>
      </div>

      <div className="space-y-4 p-5">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              Aasta
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-800">
              {vehicle.vla_year ?? "Teadmata"}
            </p>
          </div>

          <div className="rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              Lisatud
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-800">
              {formatDate(vehicle.created_at)}
            </p>
          </div>
        </div>

        <div className="space-y-3 text-sm text-slate-600">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              Asukoht
            </p>
            <p className="mt-1 font-medium text-slate-800">{locationLabel}</p>
          </div>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              Ettevõte
            </p>
            <p className="mt-1 font-medium text-slate-800">{companyLabel}</p>
          </div>
        </div>

        <button
          type="button"
          className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-600"
        >
          Vaata lähemalt
        </button>
      </div>
    </article>
  );
}

export default VehicleCard;