import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Hash,
  ImageIcon,
  MapPin,
  User,
  X,
} from "lucide-react";

import Modal from "../ui/Modal";
import type { VehicleItem, VehiclePhoto } from "../../types/vehicle";
import {
  fallbackToOriginalImage,
  getCloudinaryImageUrl,
} from "../../utils/cloudinary";

type PreviewVehicle = Pick<VehicleItem, "vehicle_id" | "reg_number" | "model">;

type PreviewPhoto = VehiclePhoto & {
  vehicle?: PreviewVehicle | null;
};

interface Props {
  isOpen: boolean;
  photo: PreviewPhoto | null;
  vehicle?: PreviewVehicle | null;
  photos: PreviewPhoto[];
  currentIndex: number;
  onClose: () => void;
  onPrevious: () => void;
  onNext: () => void;
  showVehicleLink?: boolean;
}

function formatDate(dateString?: string | null) {
  if (!dateString) {
    return "Teadmata";
  }

  return new Date(dateString).toLocaleDateString("et-EE");
}

function getPhotoLocation(photo: PreviewPhoto) {
  if (!photo.city) {
    return "Asukoht teadmata";
  }

  return `${photo.city.name}, ${photo.city.county.name}`;
}

function getVehicleTitle(vehicle?: PreviewVehicle | null) {
  if (!vehicle) {
    return "Sõiduk teadmata";
  }

  return `${vehicle.model.manufacturer} ${vehicle.model.name}`;
}

function InfoItem({
  icon,
  label,
  value,
  hideIfEmpty = false,
}: {
  icon: ReactNode;
  label: string;
  value: string | number | null | undefined;
  hideIfEmpty?: boolean;
}) {
  if (hideIfEmpty && !value) {
    return null;
  }

  return (
    <div className="flex gap-3 rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-200">
      <div className="mt-0.5 text-blue-600">{icon}</div>

      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
          {label}
        </p>

        <p className="mt-1 break-words text-sm font-semibold text-slate-800">
          {value || "Teadmata"}
        </p>
      </div>
    </div>
  );
}

function PhotoPreviewModal({
  isOpen,
  photo,
  vehicle,
  photos,
  currentIndex,
  onClose,
  onPrevious,
  onNext,
  showVehicleLink = false,
}: Props) {
  if (!photo) {
    return null;
  }

  const previewVehicle = vehicle ?? photo.vehicle ?? null;

  const imageUrl = getCloudinaryImageUrl(
    photo.file_path,
    "w_1400,q_auto,f_auto"
  );

  const hasMultiplePhotos = photos.length > 1;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" padded={false}>
      <div
        className="relative max-h-[calc(100vh-2rem)] overflow-y-auto rounded-[28px] bg-white p-4 shadow-2xl sm:p-5 [&::-webkit-scrollbar]:hidden"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 z-30 rounded-2xl bg-white/95 p-3 text-slate-500 shadow-lg ring-1 ring-slate-200 backdrop-blur transition hover:bg-slate-100 hover:text-slate-900"
          aria-label="Sulge foto"
        >
          <X size={20} />
        </button>

        <div className="grid gap-5 lg:h-[calc(100vh-170px)] lg:max-h-[620px] lg:min-h-[430px] lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="relative flex min-h-[300px] items-center justify-center overflow-hidden rounded-[24px] bg-slate-950 p-4 sm:min-h-[380px] lg:min-h-0">
            <img
              src={imageUrl}
              alt={previewVehicle?.reg_number ?? "TransitView foto"}
              onError={(event) => fallbackToOriginalImage(event, photo.file_path)}
              className="max-h-[54vh] w-full rounded-2xl object-contain lg:max-h-[540px]"
            />

            {hasMultiplePhotos && (
              <>
                <button
                  type="button"
                  onClick={onPrevious}
                  className="absolute left-4 top-1/2 inline-flex -translate-y-1/2 items-center justify-center rounded-full bg-white/90 p-3 text-slate-900 shadow-lg transition hover:bg-white"
                  aria-label="Eelmine foto"
                >
                  <ChevronLeft size={24} />
                </button>

                <button
                  type="button"
                  onClick={onNext}
                  className="absolute right-4 top-1/2 inline-flex -translate-y-1/2 items-center justify-center rounded-full bg-white/90 p-3 text-slate-900 shadow-lg transition hover:bg-white"
                  aria-label="Järgmine foto"
                >
                  <ChevronRight size={24} />
                </button>

                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-900 shadow-lg">
                  {currentIndex + 1} / {photos.length}
                </div>
              </>
            )}
          </div>

          <aside
            className="flex min-h-0 flex-col gap-4 overflow-y-auto rounded-[24px] bg-white pr-1 [&::-webkit-scrollbar]:hidden"
            style={{
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
          >
            <div className="rounded-[22px] bg-slate-950 p-5 pr-14 text-white">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-300">
                Foto detailid
              </p>

              <h3 className="mt-3 text-2xl font-bold">
                {previewVehicle?.reg_number ?? "Reg. nr teadmata"}
              </h3>

              <p className="mt-2 text-sm font-medium text-slate-300">
                {getVehicleTitle(previewVehicle)}
              </p>

              {previewVehicle && (
                <p className="mt-3 inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-slate-200 ring-1 ring-white/15">
                  {previewVehicle.model.category.name}
                </p>
              )}
            </div>

            <div className="grid gap-3">
              <InfoItem
                icon={<Hash size={18} />}
                label="Foto ID"
                value={photo.photo_id}
              />

              <InfoItem
                icon={<MapPin size={18} />}
                label="Asukoht"
                value={getPhotoLocation(photo)}
              />

              <InfoItem
                icon={<ImageIcon size={18} />}
                label="Koht"
                value={photo.place}
                hideIfEmpty
              />

              <InfoItem
                icon={<CalendarDays size={18} />}
                label="Lisatud"
                value={formatDate(photo.created_at)}
              />

              {photo.author && (
                <InfoItem
                  icon={<User size={18} />}
                  label="Autor"
                  value={photo.author.username}
                />
              )}
            </div>

            {showVehicleLink && previewVehicle && (
              <Link
                to={`/vehicles/${previewVehicle.vehicle_id}`}
                onClick={onClose}
                className="mt-auto inline-flex w-full items-center justify-center rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(37,99,235,0.22)] transition hover:bg-blue-700"
              >
                Vaata sõidukit
              </Link>
            )}
          </aside>
        </div>
      </div>
    </Modal>
  );
}

export default PhotoPreviewModal;