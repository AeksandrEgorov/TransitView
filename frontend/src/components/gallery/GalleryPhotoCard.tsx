// This file has the gallery photo card component.

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Camera, CalendarDays, ImageIcon, MapPin } from "lucide-react";

import type { GalleryPhoto } from "../../types/gallery";

import { getCloudinaryImageUrl } from "../../utils/cloudinary";
import StatusBadge from "../ui/StatusBadge";

interface Props {
  photo: GalleryPhoto;
  onPreview: (photo: GalleryPhoto) => void;
}

function formatDate(dateString?: string | Date | null) {
  if (!dateString) {
    return "Teadmata";
  }

  return new Date(dateString).toLocaleDateString("et-EE");
}

function getPhotoLocation(photo: GalleryPhoto) {
  if (!photo.city) {
    return "Asukoht teadmata";
  }

  return `${photo.city.name}, ${photo.city.county.name}`;
}

function GalleryPhotoCard({ photo, onPreview }: Props) {
  const [isVisible, setIsVisible] = useState(false);

  const vehicleTitle = photo.vehicle?.reg_number ?? "Sõiduk";

  const vehicleSubtitle = photo.vehicle?.model
    ? `${photo.vehicle.model.manufacturer} ${photo.vehicle.model.name}`
    : "Mudeli info puudub";

  const categoryName =
    photo.vehicle?.model?.category?.name ?? "Kategooria teadmata";

  const condition = photo.vehicle?.condition;

  const photoUrl = getCloudinaryImageUrl(
    photo.file_path,
    "w_700,h_450,c_fill,q_auto,f_auto"
  );

  const vehicleId = photo.vehicle?.vehicle_id ?? photo.vehicle_id;

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setIsVisible(true);
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, []);

  return (
    <article
      className={`group overflow-hidden rounded-3xl bg-white shadow-[0_18px_50px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/70 transition duration-500 ease-out hover:-translate-y-1 hover:shadow-[0_22px_60px_rgba(15,23,42,0.12)] ${
        isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
      }`}
    >
      <button
        type="button"
        onClick={() => onPreview(photo)}
        className="group/image relative block w-full overflow-hidden text-left"
      >
        <div className="relative aspect-[16/10] overflow-hidden bg-slate-200">
          <img
            src={photoUrl}
            alt={vehicleTitle}
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
          />

          <div className="absolute left-4 top-4 z-10 rounded-full bg-slate-950/90 px-3 py-1.5 text-xs font-extrabold text-white shadow-sm backdrop-blur">
            {categoryName}
          </div>

          {condition && (
            <StatusBadge
              condition={condition}
              className="absolute right-4 top-4 z-10"
            />
          )}

          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/85 via-slate-950/35 to-transparent px-4 pb-4 pt-12">
            <p className="text-xl font-extrabold tracking-tight text-white">
              {vehicleTitle}
            </p>

            <p className="mt-1 text-sm font-semibold text-slate-200">
              {vehicleSubtitle}
            </p>
          </div>

          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/0 opacity-0 transition duration-300 group-hover/image:bg-slate-950/35 group-hover/image:opacity-100">
            <span className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-bold text-slate-900 shadow-lg">
              <ImageIcon size={16} />
              Vaata fotot
            </span>
          </div>
        </div>
      </button>

      <div className="space-y-4 p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 text-blue-600" size={18} />

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Asukoht
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-800">
                  {getPhotoLocation(photo)}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
            <div className="flex items-start gap-3">
              <CalendarDays className="mt-0.5 text-blue-600" size={18} />

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Lisatud
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-800">
                  {formatDate(photo.created_at)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {photo.place && (
          <div className="rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
            <div className="flex items-start gap-3">
              <Camera className="mt-0.5 text-blue-600" size={18} />

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Koht
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-800">
                  {photo.place}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => onPreview(photo)}
            className="rounded-2xl bg-blue-600 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Vaata fotot
          </button>

          <Link
            to={`/vehicles/${vehicleId}`}
            className="rounded-2xl bg-slate-950 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Vaata sõidukit
          </Link>
        </div>
      </div>
    </article>
  );
}

export default GalleryPhotoCard;
