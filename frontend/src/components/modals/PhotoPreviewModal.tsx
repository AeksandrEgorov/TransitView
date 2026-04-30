import {
  BusFront,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ImageIcon,
  MapPin,
  User,
  X,
} from "lucide-react";
import Modal from "../ui/Modal";
import type { VehicleItem, VehiclePhoto } from "../../types/vehicle";
import { getCloudinaryImageUrl } from "../../utils/cloudinary";

interface Props {
  isOpen: boolean;
  photo: VehiclePhoto | null;
  vehicle: VehicleItem;
  photos: VehiclePhoto[];
  currentIndex: number;
  onClose: () => void;
  onPrevious: () => void;
  onNext: () => void;
}

function formatDate(dateString?: string | null) {
  if (!dateString) {
    return "Teadmata";
  }

  return new Date(dateString).toLocaleDateString("et-EE");
}

function getPhotoLocation(photo: VehiclePhoto) {
  if (!photo.city) {
    return "Asukoht teadmata";
  }

  return `${photo.city.name}, ${photo.city.county.name}`;
}

function PhotoInfoItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number | null | undefined;
}) {
  return (
    <div className="rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 shrink-0 text-blue-600">{icon}</div>

        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
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
  photos,
  currentIndex,
  onClose,
  onPrevious,
  onNext,
}: Props) {
  if (!photo) {
    return null;
  }

  const imageUrl = getCloudinaryImageUrl(
    photo.file_path,
    "w_1600,q_auto,f_auto"
  );

  const hasMultiplePhotos = photos.length > 1;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" padded={false}>
      <div className="max-h-[88vh] w-full max-w-[1180px] overflow-hidden rounded-[32px] bg-white shadow-[0_30px_90px_rgba(15,23,42,0.32)]">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-blue-600">
              Foto detailid
            </p>

            <h2 className="mt-1 text-2xl font-extrabold text-slate-900">
              {vehicle.reg_number}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {vehicle.model.manufacturer} {vehicle.model.name}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-900"
            aria-label="Sulge"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid max-h-[calc(88vh-88px)] overflow-y-auto lg:grid-cols-[1.55fr_0.65fr]">
          <div className="relative flex min-h-[360px] items-center justify-center bg-slate-950 p-3 sm:min-h-[520px] sm:p-5">
            <img
              src={imageUrl}
              alt={`${vehicle.reg_number} foto`}
              className="max-h-[68vh] w-full rounded-2xl object-contain"
            />

            {hasMultiplePhotos && (
              <>
                <button
                  type="button"
                  onClick={onPrevious}
                  className="absolute left-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-900 shadow-lg backdrop-blur transition hover:bg-white hover:scale-105"
                  aria-label="Eelmine foto"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>

                <button
                  type="button"
                  onClick={onNext}
                  className="absolute right-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-900 shadow-lg backdrop-blur transition hover:bg-white hover:scale-105"
                  aria-label="Järgmine foto"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>

                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white/90 px-4 py-2 text-xs font-bold text-slate-800 shadow-lg backdrop-blur">
                  {currentIndex + 1} / {photos.length}
                </div>
              </>
            )}
          </div>

          <aside className="space-y-4 bg-white p-5 sm:p-6">
            <div className="rounded-3xl bg-[#101a2d] p-5 text-white">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-300">
                Foto info
              </p>

              <h3 className="mt-2 text-xl font-extrabold">
                {vehicle.reg_number}
              </h3>

              <p className="mt-1 text-sm text-slate-300">
                {vehicle.model.manufacturer} {vehicle.model.name}
              </p>
            </div>

            <PhotoInfoItem
              icon={<BusFront className="h-5 w-5" />}
              label="Sõiduk"
              value={`${vehicle.model.manufacturer} ${vehicle.model.name}`}
            />

            <PhotoInfoItem
              icon={<MapPin className="h-5 w-5" />}
              label="Asukoht"
              value={getPhotoLocation(photo)}
            />

            <PhotoInfoItem
              icon={<ImageIcon className="h-5 w-5" />}
              label="Koht"
              value={photo.place}
            />

            <PhotoInfoItem
              icon={<CalendarDays className="h-5 w-5" />}
              label="Pildistatud"
              value={formatDate(photo.taken_at)}
            />

            <PhotoInfoItem
              icon={<CalendarDays className="h-5 w-5" />}
              label="Lisatud"
              value={formatDate(photo.created_at)}
            />

            {photo.author && (
              <PhotoInfoItem
                icon={<User className="h-5 w-5" />}
                label="Autor"
                value={photo.author.username}
              />
            )}

            {hasMultiplePhotos && (
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={onPrevious}
                  className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-100"
                >
                  Eelmine
                </button>

                <button
                  type="button"
                  onClick={onNext}
                  className="rounded-2xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
                >
                  Järgmine
                </button>
              </div>
            )}
          </aside>
        </div>
      </div>
    </Modal>
  );
}

export default PhotoPreviewModal;