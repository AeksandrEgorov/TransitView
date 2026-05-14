// This file has the my photo card component.

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Camera, Eye, ImageIcon, Pencil, Trash2 } from "lucide-react";

import ReviewStatusBadge from "../ReviewStatusBadge";
import StatusBadge from "../../ui/StatusBadge";
import { getCloudinaryImageUrl } from "../../../utils/cloudinary";

import type { DashboardPhoto } from "../../../types/dashboard";
function formatDate(value?: string | null) {
  if (!value) {
    return "Teadmata";
  }

  return new Date(value).toLocaleDateString("et-EE");
}

interface MyPhotoCardProps {
  photo: DashboardPhoto;
  index: number;
  onPreview: (photo: DashboardPhoto) => void;
  onEdit: (photo: DashboardPhoto) => void;
  onDelete: (photo: DashboardPhoto) => void;
}

function MyPhotoCard({
  photo,
  index,
  onPreview,
  onEdit,
  onDelete,
}: MyPhotoCardProps) {
  const [isVisible, setIsVisible] = useState(false);

  const canModify = photo.status !== "Kinnitatud";

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setIsVisible(true);
    }, Math.min(index, 8) * 45);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [index, photo.photo_id]);

  return (
    <article
      className={`overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200 transition duration-500 ease-out hover:-translate-y-1 hover:shadow-[0_18px_50px_rgba(15,23,42,0.10)] ${
        isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
      }`}
    >
      <div className="grid gap-0 lg:grid-cols-[220px_minmax(0,1fr)]">
        <button
          type="button"
          onClick={() => onPreview(photo)}
          className="group relative min-h-44 overflow-hidden bg-slate-200 text-left lg:min-h-full"
        >
          {photo.file_path ? (
            <img
              src={getCloudinaryImageUrl(
                photo.file_path,
                "w_500,h_360,c_fill,q_auto,f_auto"
              )}
              alt={photo.vehicle.reg_number}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
            />
          ) : (
            <div className="flex h-full min-h-44 items-center justify-center text-slate-400">
              <Camera size={32} />
            </div>
          )}

          <StatusBadge
            condition={photo.vehicle.condition}
            className="absolute right-4 top-4"
          />

          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/0 opacity-0 transition group-hover:bg-slate-950/35 group-hover:opacity-100">
            <span className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-bold text-slate-900 shadow-lg">
              <ImageIcon size={16} />
              Vaata fotot
            </span>
          </div>
        </button>

        <div className="p-5">
          <div className="flex flex-col gap-4 2xl:flex-row 2xl:items-start 2xl:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="text-2xl font-extrabold text-slate-950">
                  {photo.vehicle.reg_number}
                </h3>

                <ReviewStatusBadge status={photo.status} />
              </div>

              <p className="mt-2 text-sm font-semibold text-slate-600">
                {photo.vehicle.model.manufacturer} {photo.vehicle.model.name}
              </p>

              <p className="mt-1 text-sm text-slate-500">
                {photo.vehicle.model.category.name} · Lisatud{" "}
                {formatDate(photo.created_at)}
              </p>

              <p className="mt-1 text-sm text-slate-500">
                {photo.city
                  ? `${photo.city.name}, ${photo.city.county.name}`
                  : "Linn puudub / väljaspool linna"}
                {photo.place ? ` · ${photo.place}` : ""}
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 2xl:w-auto 2xl:min-w-[360px]">
              <div className="flex flex-wrap gap-2 2xl:justify-end">
                <button
                  type="button"
                  onClick={() => onPreview(photo)}
                  className="inline-flex min-w-[125px] flex-1 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-700 2xl:flex-none"
                >
                  <ImageIcon size={16} />
                  Vaata fotot
                </button>

                <Link
                  to={`/dashboard/vehicles/${photo.vehicle_id}`}
                  className="inline-flex min-w-[135px] flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 2xl:flex-none"
                >
                  <Eye size={16} />
                  Vaata sõidukit
                </Link>
              </div>

              {canModify && (
                <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-3 2xl:justify-end">
                  <button
                    type="button"
                    onClick={() => onEdit(photo)}
                    className="inline-flex min-w-[105px] flex-1 items-center justify-center gap-2 rounded-2xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-200 2xl:flex-none"
                  >
                    <Pencil size={16} />
                    Muuda
                  </button>

                  <button
                    type="button"
                    onClick={() => onDelete(photo)}
                    className="inline-flex min-w-[105px] flex-1 items-center justify-center gap-2 rounded-2xl bg-rose-50 px-4 py-2 text-sm font-bold text-rose-600 transition hover:bg-rose-100 2xl:flex-none"
                  >
                    <Trash2 size={16} />
                    Kustuta
                  </button>
                </div>
              )}
            </div>
          </div>

          {photo.review_comment && (
            <div className="mt-4 rounded-2xl bg-rose-50 p-4 text-sm font-medium text-rose-700 ring-1 ring-rose-100">
              <span className="font-bold">Kommentaar: </span>
              {photo.review_comment}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}


export default MyPhotoCard;
