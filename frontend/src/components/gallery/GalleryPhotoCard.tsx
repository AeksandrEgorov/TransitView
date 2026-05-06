import { Link } from "react-router-dom";
import type { GalleryPhoto } from "../../types/gallery";
import type { VehicleCondition } from "../../types/vehicle";
import { formatVehicleCondition } from "../../utils/formatters";
import {
  fallbackToOriginalImage,
  getCloudinaryImageUrl,
} from "../../utils/cloudinary";

interface Props {
  photo: GalleryPhoto;
  onPreview: (photo: GalleryPhoto) => void;
}

function formatDate(dateString?: string | null) {
  if (!dateString) {
    return "Teadmata";
  }

  return new Date(dateString).toLocaleDateString("et-EE");
}

function getConditionBadgeClass(condition: VehicleCondition) {
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

function getVehicleName(photo: GalleryPhoto) {
  if (!photo.vehicle) {
    return "Sõiduk teadmata";
  }

  return `${photo.vehicle.model.manufacturer} ${photo.vehicle.model.name}`;
}

function getLocationLabel(photo: GalleryPhoto) {
  if (!photo.city) {
    return "Asukoht teadmata";
  }

  return `${photo.city.name}, ${photo.city.county.name}`;
}

function GalleryPhotoCard({ photo, onPreview }: Props) {
  const imageUrl = getCloudinaryImageUrl(
    photo.file_path,
    "w_700,h_450,c_fill,q_auto,f_auto"
  );

  const vehicle = photo.vehicle;

  return (
    <article className="group overflow-hidden rounded-3xl bg-white shadow-[0_18px_50px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/70 transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_60px_rgba(15,23,42,0.12)]">
      <button
        type="button"
        onClick={() => onPreview(photo)}
        className="block w-full text-left"
      >
        <div className="relative aspect-[16/10] overflow-hidden bg-slate-200">
          <img
            src={imageUrl}
            alt={vehicle?.reg_number ?? "TransitView foto"}
            onError={(event) => fallbackToOriginalImage(event, photo.file_path)}
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
          />

          <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-4">
            <span className="rounded-full bg-slate-950/75 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
              {vehicle?.model.category.name ?? "Kategooria teadmata"}
            </span>

            {vehicle && (
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 backdrop-blur ${getConditionBadgeClass(
                  vehicle.condition
                )}`}
              >
                {formatVehicleCondition(vehicle.condition)}
              </span>
            )}
          </div>

          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/85 via-slate-950/35 to-transparent px-4 pb-4 pt-10">
            <p className="text-lg font-bold text-white">
              {vehicle?.reg_number ?? "Reg. nr teadmata"}
            </p>

            <p className="text-sm text-slate-200">{getVehicleName(photo)}</p>
          </div>
        </div>
      </button>

      <div className="space-y-4 p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              Lisatud
            </p>

            <p className="mt-1 text-sm font-semibold text-slate-800">
              {formatDate(photo.created_at)}
            </p>
          </div>

          <div className="rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              Asukoht
            </p>

            <p className="mt-1 text-sm font-semibold text-slate-800">
              {getLocationLabel(photo)}
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => onPreview(photo)}
            className="rounded-2xl bg-blue-600 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Vaata fotot
          </button>

          {vehicle && (
            <Link
              to={`/vehicles/${vehicle.vehicle_id}`}
              className="rounded-2xl bg-slate-950 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Vaata sõidukit
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}

export default GalleryPhotoCard;