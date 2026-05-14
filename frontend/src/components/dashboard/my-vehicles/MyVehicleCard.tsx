// This file has the my vehicle card component.

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Camera, Eye, Pencil, Plus, ShieldCheck, Trash2 } from "lucide-react";

import ReviewStatusBadge from "../ReviewStatusBadge";
import StatusBadge from "../../ui/StatusBadge";
import { getCloudinaryImageUrl } from "../../../utils/cloudinary";

import type { DashboardVehicle } from "../../../types/dashboard";
function formatDate(value?: string | null) {
  if (!value) {
    return "Teadmata";
  }

  return new Date(value).toLocaleDateString("et-EE");
}

interface MyVehicleCardProps {
  vehicle: DashboardVehicle;
  index: number;
  onAddPhoto: (vehicleId: number) => void;
  onEdit: (vehicle: DashboardVehicle) => void;
  onDelete: (vehicle: DashboardVehicle) => void;
}

function MyVehicleCard({
  vehicle,
  index,
  onAddPhoto,
  onEdit,
  onDelete,
}: MyVehicleCardProps) {
  const [isVisible, setIsVisible] = useState(false);

  const canModify = vehicle.status !== "Kinnitatud";
  const canOpenPublicView = vehicle.status === "Kinnitatud";
  const coverPhoto = vehicle.photos?.[0] ?? null;

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setIsVisible(true);
    }, Math.min(index, 8) * 45);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [index, vehicle.vehicle_id]);

  return (
    <article
      className={`overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200 transition duration-500 ease-out hover:-translate-y-1 hover:shadow-[0_18px_50px_rgba(15,23,42,0.10)] ${
        isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
      }`}
    >
      <div className="grid gap-0 lg:grid-cols-[220px_minmax(0,1fr)]">
        <div className="relative min-h-48 bg-slate-200 lg:min-h-full">
          {coverPhoto?.file_path ? (
            <img
              src={getCloudinaryImageUrl(
                coverPhoto.file_path,
                "w_500,h_360,c_fill,q_auto,f_auto"
              )}
              alt={vehicle.reg_number}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full min-h-48 items-center justify-center text-slate-400">
              <Camera size={32} />
            </div>
          )}

          <StatusBadge
            condition={vehicle.condition}
            className="absolute right-4 top-4"
          />
        </div>

        <div className="p-5">
          <div className="flex flex-col gap-4 2xl:flex-row 2xl:items-start 2xl:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="text-2xl font-extrabold text-slate-950">
                  {vehicle.reg_number}
                </h3>

                <ReviewStatusBadge status={vehicle.status} />
              </div>

              <p className="mt-2 text-sm font-semibold text-slate-600">
                {vehicle.model.manufacturer} {vehicle.model.name}
              </p>

              <p className="mt-1 text-sm text-slate-500">
                {vehicle.model.category.name} · Lisatud{" "}
                {formatDate(vehicle.created_at)}
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Fotosid: {vehicle.photos_count ?? vehicle.photos.length}
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 2xl:w-auto 2xl:min-w-[420px]">
              <div className="flex flex-wrap gap-2 2xl:justify-end">
                <Link
                  to={`/dashboard/vehicles/${vehicle.vehicle_id}`}
                  className="inline-flex min-w-[165px] flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 2xl:flex-none"
                >
                  <Eye size={16} />
                  Vaata detailsemalt
                </Link>

                {canOpenPublicView && (
                  <Link
                    to={`/vehicles/${vehicle.vehicle_id}`}
                    className="inline-flex min-w-[135px] flex-1 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-2 text-sm font-bold text-white transition hover:bg-slate-800 2xl:flex-none"
                  >
                    <ShieldCheck size={16} />
                    Avalik vaade
                  </Link>
                )}
              </div>

              <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-3 2xl:justify-end">
                <button
                  type="button"
                  onClick={() => onAddPhoto(vehicle.vehicle_id)}
                  className="inline-flex min-w-[120px] flex-1 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-700 2xl:flex-none"
                >
                  <Plus size={16} />
                  Lisa foto
                </button>

                {canModify && (
                  <>
                    <button
                      type="button"
                      onClick={() => onEdit(vehicle)}
                      className="inline-flex min-w-[105px] flex-1 items-center justify-center gap-2 rounded-2xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-200 2xl:flex-none"
                    >
                      <Pencil size={16} />
                      Muuda
                    </button>

                    <button
                      type="button"
                      onClick={() => onDelete(vehicle)}
                      className="inline-flex min-w-[105px] flex-1 items-center justify-center gap-2 rounded-2xl bg-rose-50 px-4 py-2 text-sm font-bold text-rose-600 transition hover:bg-rose-100 2xl:flex-none"
                    >
                      <Trash2 size={16} />
                      Kustuta
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {vehicle.review_comment && (
            <div className="mt-4 rounded-2xl bg-rose-50 p-4 text-sm font-medium text-rose-700 ring-1 ring-rose-100">
              <span className="font-bold">Kommentaar: </span>
              {vehicle.review_comment}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}


export default MyVehicleCard;
