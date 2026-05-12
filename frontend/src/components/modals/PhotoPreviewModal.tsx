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
import type { GalleryPhoto } from "../../types/gallery";
import type { VehicleItem, VehiclePhoto } from "../../types/vehicle";
import type {
  DashboardPhoto,
  DashboardVehicle,
  DashboardVehiclePhoto,
} from "../../types/dashboard";
import { getCloudinaryImageUrl } from "../../utils/cloudinary";

type PreviewPhoto =
  | VehiclePhoto
  | GalleryPhoto
  | DashboardPhoto
  | DashboardVehiclePhoto;

type PreviewVehicle =
  | VehicleItem
  | GalleryPhoto["vehicle"]
  | DashboardPhoto["vehicle"]
  | DashboardVehicle
  | null;

interface Props {
  isOpen: boolean;
  photo: PreviewPhoto | null;
  vehicle?: PreviewVehicle;
  photos?: PreviewPhoto[];
  currentIndex?: number;
  onClose: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  showVehicleLink?: boolean;
  vehicleLink?: string;
}

function formatDate(dateString?: string | Date | null) {
  if (!dateString) {
    return "Teadmata";
  }

  return new Date(dateString).toLocaleDateString("et-EE");
}

function getPhotoVehicle(photo: PreviewPhoto | null, vehicle?: PreviewVehicle) {
  if (vehicle) {
    return vehicle;
  }

  if (photo && "vehicle" in photo) {
    return photo.vehicle;
  }

  return null;
}

function getPhotoLocation(photo: PreviewPhoto) {
  if (!("city" in photo) || !photo.city) {
    return "Asukoht teadmata";
  }

  return `${photo.city.name}, ${photo.city.county.name}`;
}

function getPhotoAuthor(photo: PreviewPhoto) {
  if ("author" in photo) {
    return photo.author;
  }

  return null;
}

function DetailItem({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string | number | null | undefined;
}) {
  return (
    <div className="rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 text-blue-600">{icon}</div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            {label}
          </p>

          <p className="mt-1 break-words text-sm font-semibold text-slate-800">
            {value || "Teadmata"}
          </p>
        </div>
      </div>
    </div>
  );
}

function PhotoPreviewModal({
  isOpen,
  photo,
  vehicle,
  photos = [],
  currentIndex = 0,
  onClose,
  onPrevious,
  onNext,
  showVehicleLink = false,
  vehicleLink,
}: Props) {
  if (!isOpen || !photo) {
    return null;
  }

  const currentVehicle = getPhotoVehicle(photo, vehicle);
  const author = getPhotoAuthor(photo);

  const vehicleTitle = currentVehicle?.reg_number ?? "Foto";

  const vehicleSubtitle = currentVehicle?.model
    ? `${currentVehicle.model.manufacturer} ${currentVehicle.model.name}`
    : "Sõiduki info puudub";

  const vehicleCategory = currentVehicle?.model?.category?.name;

  const hasMultiplePhotos = photos.length > 1 && onPrevious && onNext;

  const imageUrl = photo.file_path
    ? getCloudinaryImageUrl(
        photo.file_path,
        "w_1200,h_760,c_fit,q_auto,f_auto"
      )
    : "https://placehold.co/1200x760/e2e8f0/475569?text=TransitView";

  const finalVehicleLink =
    vehicleLink ??
    (currentVehicle?.vehicle_id
      ? `/vehicles/${currentVehicle.vehicle_id}`
      : undefined);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" padded={false}>
      <div className="relative overflow-hidden rounded-[28px] bg-white">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-30 flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-900"
          aria-label="Sulge"
        >
          <X size={20} />
        </button>

        <div className="grid max-h-[82vh] overflow-hidden lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="relative flex min-h-[420px] items-center justify-center bg-slate-950 p-5 sm:p-6 lg:min-h-[620px]">
            <img
              src={imageUrl}
              alt={vehicleTitle}
              className="max-h-[68vh] w-full rounded-3xl object-contain"
            />

            {hasMultiplePhotos && (
              <>
                <button
                  type="button"
                  onClick={onPrevious}
                  className="absolute left-4 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-slate-900 shadow-lg transition hover:bg-white"
                  aria-label="Eelmine foto"
                >
                  <ChevronLeft size={24} />
                </button>

                <button
                  type="button"
                  onClick={onNext}
                  className="absolute right-4 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-slate-900 shadow-lg transition hover:bg-white"
                  aria-label="Järgmine foto"
                >
                  <ChevronRight size={24} />
                </button>

                <div className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-900 shadow-lg">
                  {currentIndex + 1} / {photos.length}
                </div>
              </>
            )}
          </div>

          <aside className="max-h-[82vh] overflow-y-auto bg-white p-5 sm:p-6">
            <div className="rounded-[24px] bg-slate-950 p-5 text-white">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-400">
                Foto detailid
              </p>

              <h2 className="mt-3 text-2xl font-extrabold tracking-tight">
                {vehicleTitle}
              </h2>

              <p className="mt-2 text-sm font-semibold text-slate-300">
                {vehicleSubtitle}
              </p>

              {vehicleCategory && (
                <span className="mt-3 inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white">
                  {vehicleCategory}
                </span>
              )}
            </div>

            <div className="mt-4 space-y-3">
              <DetailItem
                icon={<Hash size={18} />}
                label="Foto ID"
                value={photo.photo_id}
              />

              <DetailItem
                icon={<MapPin size={18} />}
                label="Asukoht"
                value={getPhotoLocation(photo)}
              />

              <DetailItem
                icon={<ImageIcon size={18} />}
                label="Koht"
                value={photo.place}
              />

              <DetailItem
                icon={<CalendarDays size={18} />}
                label="Lisatud"
                value={formatDate(photo.created_at)}
              />

              {author && (
                <DetailItem
                  icon={<User size={18} />}
                  label="Autor"
                  value={author.username}
                />
              )}
            </div>

            {showVehicleLink && finalVehicleLink && (
              <Link
                to={finalVehicleLink}
                className="mt-5 inline-flex w-full items-center justify-center rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-[0_14px_30px_rgba(37,99,235,0.22)] transition hover:bg-blue-700"
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