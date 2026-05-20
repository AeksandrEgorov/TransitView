// This file has the vehicle card component.

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import type { VehicleItem } from "../../types/vehicle";

import { getCloudinaryImageUrl } from "../../utils/cloudinary";
import StatusBadge from "../ui/StatusBadge";

interface Props {
  vehicle: VehicleItem;
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("et-EE");
}

function VehicleCard({ vehicle }: Props) {
  const [isVisible, setIsVisible] = useState(false);

  const firstPhoto = vehicle.photos[0];

  const imageUrl = firstPhoto?.file_path
    ? getCloudinaryImageUrl(
        firstPhoto.file_path,
        "w_700,h_450,c_fill,q_auto,f_auto"
      )
    : "https://placehold.co/800x500/e2e8f0/475569?text=TransitView";

  const locationLabel = firstPhoto?.city
    ? `${firstPhoto.city.name}, ${firstPhoto.city.county.name}`
    : "Asukoht teadmata";

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
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-200">
        <img
          src={imageUrl}
          alt={vehicle.reg_number}
          loading="lazy"
          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
        />

        <div className="absolute left-4 top-4 rounded-full bg-slate-950/90 px-3 py-1.5 text-xs font-extrabold text-white shadow-sm backdrop-blur">
          {vehicle.model.category.name}
        </div>

        <StatusBadge
          condition={vehicle.condition}
          className="absolute right-4 top-4"
        />

        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/85 via-slate-950/35 to-transparent px-5 pb-5 pt-16">
          <p className="text-2xl font-extrabold tracking-tight text-white">
            {vehicle.reg_number}
          </p>

          <p className="mt-1 text-sm font-semibold text-slate-200">
            {vehicle.model.manufacturer} {vehicle.model.name}
          </p>
        </div>
      </div>

      <div className="space-y-4 p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Aasta
            </p>

            <p className="mt-1 text-sm font-semibold text-slate-800">
              {vehicle.vla_year ?? "Teadmata"}
            </p>
          </div>

          <div className="rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Lisatud
            </p>

            <p className="mt-1 text-sm font-semibold text-slate-800">
              {formatDate(vehicle.created_at)}
            </p>
          </div>
        </div>

        <div className="rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Asukoht
          </p>

          <p className="mt-1 text-sm font-semibold text-slate-800">
            {locationLabel}
          </p>
        </div>

        <Link
          to={`/vehicles/${vehicle.vehicle_id}`}
          className="block rounded-2xl bg-slate-950 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Vaata lähemalt
        </Link>
      </div>
    </article>
  );
}

export default VehicleCard;
