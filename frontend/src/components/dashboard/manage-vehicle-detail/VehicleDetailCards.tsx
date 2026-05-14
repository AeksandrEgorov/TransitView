// This file has the vehicle detail cards component.

import { CheckCircle2, Clock3, Pencil, Trash2, XCircle } from "lucide-react";

import ReviewStatusBadge from "../ReviewStatusBadge";
import { getCloudinaryImageUrl } from "../../../utils/cloudinary";
import { getConditionStyles } from "../../../utils/conditionStyles";
import { formatVehicleCondition } from "../../../utils/formatters";

import type { ManageVehicle } from "../../../config/manageApi";
import type { VehicleCondition } from "../../../types/vehicle";

export type ManageVehiclePhoto = NonNullable<ManageVehicle["photos"]>[number];
export function InfoCard({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  return (
    <div className="rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-semibold text-slate-800">
        {value || "Teadmata"}
      </p>
    </div>
  );
}

export function ConditionInfoCard({
  condition,
}: {
  condition: VehicleCondition;
}) {
  return (
    <div
      className={`rounded-2xl px-4 py-3 ring-1 ${getConditionStyles(condition)}`}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-current opacity-70">
        Seisund
      </p>

      <p className="mt-3 text-sm font-bold text-current">
        {formatVehicleCondition(condition)}
      </p>
    </div>
  );
}
function formatDate(dateString?: string | null) {
  if (!dateString) {
    return "Teadmata";
  }

  return new Date(dateString).toLocaleDateString("et-EE");
}

function getPhotoLocation(photo?: ManageVehiclePhoto | null) {
  if (!photo?.city) {
    return "Asukoht teadmata";
  }

  return `${photo.city.name}, ${photo.city.county.name}`;
}

function getUserLabel(
  user?: {
    username?: string | null;
    email?: string | null;
    role?: string | null;
  } | null
) {
  if (!user) {
    return "Kasutaja teadmata";
  }

  const username = user.username || "Nimetu kasutaja";

  return `${username}`;
}

export function VehiclePhotoCard({
  photo,
  isFirstPhoto,
  onPreview,
  onEdit,
  onDelete,
  onApprove,
  onReject,
  onPending,
}: {
  photo: ManageVehiclePhoto;
  isFirstPhoto: boolean;
  onPreview: (photo: ManageVehiclePhoto) => void;
  onEdit: (photo: ManageVehiclePhoto) => void;
  onDelete: (photo: ManageVehiclePhoto) => void;
  onApprove: (photo: ManageVehiclePhoto) => void;
  onReject: (photo: ManageVehiclePhoto) => void;
  onPending: (photo: ManageVehiclePhoto) => void;
}) {
  const canModify = photo.status !== "Kinnitatud";
  const canApprove = photo.status !== "Kinnitatud";
  const canPending =
    photo.status === "Kinnitatud" || photo.status === "Tagasi_lukatud";
  const canReject = photo.status !== "Tagasi_lukatud";
  const hasManageActions = canModify || canApprove || canPending || canReject;

  const photoUrl = photo.file_path
    ? getCloudinaryImageUrl(
        photo.file_path,
        "w_850,h_560,c_fill,q_auto,f_auto"
      )
    : "https://placehold.co/900x600/e2e8f0/475569?text=TransitView";

  return (
    <article className="group overflow-hidden rounded-3xl bg-white shadow-[0_18px_50px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/70 transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_60px_rgba(15,23,42,0.12)]">
      <div className="grid gap-0 xl:grid-cols-[360px_minmax(0,1fr)]">
        <button
          type="button"
          onClick={() => onPreview(photo)}
          className="relative min-h-72 overflow-hidden bg-slate-200 text-left xl:min-h-full"
        >
          <img
            src={photoUrl}
            alt="Sõiduki foto"
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
          />

          {isFirstPhoto && (
            <span className="absolute left-4 top-4 rounded-full bg-slate-950/80 px-3 py-1 text-xs font-semibold text-white shadow-sm backdrop-blur">
              Esimene foto
            </span>
          )}

          {photo.status && (
            <div className="absolute right-4 top-4">
              <ReviewStatusBadge status={photo.status} />
            </div>
          )}

          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/85 via-slate-950/35 to-transparent px-5 pb-5 pt-16">
            <p className="text-base font-bold text-white">
              {getPhotoLocation(photo)}
            </p>

            {photo.place && (
              <p className="mt-1 text-sm font-medium text-slate-200">
                {photo.place}
              </p>
            )}
          </div>
        </button>

        <div className="flex flex-col justify-between gap-5 p-5">
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <InfoCard label="Asukoht" value={getPhotoLocation(photo)} />
              <InfoCard label="Lisatud" value={formatDate(photo.created_at)} />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <InfoCard label="Koht" value={photo.place} />

              {photo.author && (
                <InfoCard label="Autor" value={getUserLabel(photo.author)} />
              )}
            </div>

            {photo.review_comment && (
              <div className="rounded-2xl bg-rose-50 p-4 text-sm font-medium text-rose-700 ring-1 ring-rose-100">
                <span className="font-bold">Kommentaar: </span>
                {photo.review_comment}
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => onPreview(photo)}
              className="inline-flex min-w-[130px] flex-1 items-center justify-center rounded-2xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700 sm:flex-none"
            >
              Vaata fotot
            </button>

            {hasManageActions && (
              <>
                {canModify && (
                  <>
                    <button
                      type="button"
                      onClick={() => onEdit(photo)}
                      className="inline-flex min-w-[110px] flex-1 items-center justify-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-200 sm:flex-none"
                    >
                      <Pencil size={16} />
                      Muuda
                    </button>

                    <button
                      type="button"
                      onClick={() => onDelete(photo)}
                      className="inline-flex min-w-[110px] flex-1 items-center justify-center gap-2 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-600 transition hover:bg-rose-100 sm:flex-none"
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
                    className="inline-flex min-w-[110px] flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 sm:flex-none"
                  >
                    <CheckCircle2 size={16} />
                    Kinnita
                  </button>
                )}

                {canPending && (
                  <button
                    type="button"
                    onClick={() => onPending(photo)}
                    className="inline-flex min-w-[125px] flex-1 items-center justify-center gap-2 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-bold text-amber-700 transition hover:bg-amber-100 sm:flex-none"
                  >
                    <Clock3 size={16} />
                    Pane ootele
                  </button>
                )}

                {canReject && (
                  <button
                    type="button"
                    onClick={() => onReject(photo)}
                    className="inline-flex min-w-[140px] flex-1 items-center justify-center gap-2 rounded-2xl bg-orange-50 px-4 py-3 text-sm font-bold text-orange-700 transition hover:bg-orange-100 sm:flex-none"
                  >
                    <XCircle size={16} />
                    Lükka tagasi
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

