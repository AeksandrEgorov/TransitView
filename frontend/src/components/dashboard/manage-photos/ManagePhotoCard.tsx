// This file has the manage photo card component.

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Camera,
  CheckCircle2,
  Clock3,
  Eye,
  ImageIcon,
  Pencil,
  ShieldCheck,
  Trash2,
  XCircle,
} from "lucide-react";

import ReviewStatusBadge from "../ReviewStatusBadge";
import StatusBadge from "../../ui/StatusBadge";
import { getCloudinaryImageUrl } from "../../../utils/cloudinary";

import type { ManagePhoto } from "../../../config/manageApi";
function formatDate(value?: string | null) {
  if (!value) {
    return "Teadmata";
  }

  return new Date(value).toLocaleDateString("et-EE");
}

function getPhotoUserLabel(photo: ManagePhoto) {
  const extendedPhoto = photo as ManagePhoto & {
    author?: {
      user_id?: number;
      username?: string | null;
      email?: string | null;
    } | null;
  };

  if (!extendedPhoto.author) {
    return "Kasutaja teadmata";
  }

  const username = extendedPhoto.author.username || "Nimetu kasutaja";
  const email = extendedPhoto.author.email
    ? ` · ${extendedPhoto.author.email}`
    : "";

  return `${username}${email}`;
}

interface ManagePhotoCardProps {
  photo: ManagePhoto;
  index: number;
  onPreview: (photo: ManagePhoto) => void;
  onEdit: (photo: ManagePhoto) => void;
  onDelete: (photo: ManagePhoto) => void;
  onApprove: (photo: ManagePhoto) => void;
  onReject: (photo: ManagePhoto) => void;
  onPending: (photo: ManagePhoto) => void;
}

function ManagePhotoCard({
  photo,
  index,
  onPreview,
  onEdit,
  onDelete,
  onApprove,
  onReject,
  onPending,
}: ManagePhotoCardProps) {
  const [isVisible, setIsVisible] = useState(false);

  const canModify = photo.status !== "Kinnitatud";
  const canApprove = photo.status !== "Kinnitatud";
  const canPending = photo.status !== "Ootel";
  const canReject = photo.status !== "Tagasi_lukatud";
  const hasManageActions = canModify || canApprove || canPending || canReject;
  const canOpenPublicVehicle = photo.vehicle.status === "Kinnitatud";

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

              <p className="mt-1 text-sm text-slate-500">
                Kasutaja: {getPhotoUserLabel(photo)}
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 2xl:w-auto 2xl:min-w-[520px]">
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
                  to={`/dashboard/manage/vehicles/${photo.vehicle_id}`}
                  className="inline-flex min-w-[135px] flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 2xl:flex-none"
                >
                  <Eye size={16} />
                  Vaata sõidukit
                </Link>

                {canOpenPublicVehicle && (
                  <Link
                    to={`/vehicles/${photo.vehicle_id}`}
                    className="inline-flex min-w-[135px] flex-1 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-2 text-sm font-bold text-white transition hover:bg-slate-800 2xl:flex-none"
                  >
                    <ShieldCheck size={16} />
                    Avalik vaade
                  </Link>
                )}
              </div>

              {hasManageActions && (
                <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-3 2xl:justify-end">
                  {canModify && (
                    <>
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
                    </>
                  )}

                  {canApprove && (
                    <button
                      type="button"
                      onClick={() => onApprove(photo)}
                      className="inline-flex min-w-[110px] flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-emerald-700 2xl:flex-none"
                    >
                      <CheckCircle2 size={16} />
                      Kinnita
                    </button>
                  )}

                  {canPending && (
                    <button
                      type="button"
                      onClick={() => onPending(photo)}
                      className="inline-flex min-w-[125px] flex-1 items-center justify-center gap-2 rounded-2xl bg-amber-50 px-4 py-2 text-sm font-bold text-amber-700 transition hover:bg-amber-100 2xl:flex-none"
                    >
                      <Clock3 size={16} />
                      Pane ootele
                    </button>
                  )}

                  {canReject && (
                    <button
                      type="button"
                      onClick={() => onReject(photo)}
                      className="inline-flex min-w-[145px] flex-1 items-center justify-center gap-2 rounded-2xl bg-orange-50 px-4 py-2 text-sm font-bold text-orange-700 transition hover:bg-orange-100 2xl:flex-none"
                    >
                      <XCircle size={16} />
                      Lükka tagasi
                    </button>
                  )}
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


export default ManagePhotoCard;
