import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  Camera,
  CheckCircle2,
  Clock3,
  Images,
  MapPin,
  Pencil,
  Plus,
  ShieldCheck,
  Trash2,
  User,
  XCircle,
} from "lucide-react";

import DashboardPageHeader from "../../../components/dashboard/DashboardPageHeader";
import ReviewStatusBadge from "../../../components/dashboard/ReviewStatusBadge";
import AddPhotoModal from "../../../components/modals/AddPhotoModal";
import UpdateVehicleModal from "../../../components/modals/UpdateVehicleModal";
import UpdatePhotoModal from "../../../components/modals/UpdatePhotoModal";
import PhotoPreviewModal from "../../../components/modals/PhotoPreviewModal";
import DeleteConfirmModal from "../../../components/modals/DeleteConfirmModal";
import ApproveConfirmModal from "../../../components/modals/ApproveConfirmModal";
import RejectReasonModal from "../../../components/modals/RejectReasonModal";
import PendingConfirmModal from "../../../components/modals/PendingConfirmModal";

import {
  approveManagePhoto,
  approveManageVehicle,
  deleteManagePhoto,
  deleteManageVehicle,
  getManageVehicleById,
  pendingManagePhoto,
  pendingManageVehicle,
  rejectManagePhoto,
  rejectManageVehicle,
  updateManagePhoto,
  updateManageVehicle,
  type ManageVehicle,
} from "../../../config/manageApi";
import { getCities } from "../../../config/referenceApi";

import { useToast } from "../../../hooks/useToast";
import { getCloudinaryImageUrl } from "../../../utils/cloudinary";
import { formatVehicleCondition } from "../../../utils/formatters";

import type { CityItem } from "../../../types/reference";
import type {
  DashboardVehicle,
  DashboardVehiclePhoto,
} from "../../../types/dashboard";
import type { VehicleCondition } from "../../../types/vehicle";

type ManageVehiclePhoto = NonNullable<ManageVehicle["photos"]>[number];

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

function getPhotoDate(photo?: ManageVehiclePhoto | null) {
  if (!photo?.taken_at) {
    return "Kuupäev teadmata";
  }

  return formatDate(photo.taken_at);
}

function getConditionCardClass(condition: VehicleCondition) {
  if (condition === "Töökorras") {
    return "bg-emerald-50 ring-emerald-200";
  }

  if (condition === "Ei_tööta") {
    return "bg-amber-50 ring-amber-200";
  }

  if (condition === "Maha_kantud") {
    return "bg-rose-50 ring-rose-200";
  }

  if (condition === "Müüdud") {
    return "bg-violet-50 ring-violet-200";
  }

  return "bg-slate-100 ring-slate-200";
}

function getConditionTextClass(condition: VehicleCondition) {
  if (condition === "Töökorras") {
    return "text-emerald-700";
  }

  if (condition === "Ei_tööta") {
    return "text-amber-700";
  }

  if (condition === "Maha_kantud") {
    return "text-rose-700";
  }

  if (condition === "Müüdud") {
    return "text-violet-700";
  }

  return "text-slate-700";
}

function getPhotosCount(vehicle: ManageVehicle, photosLength: number) {
  const extendedVehicle = vehicle as ManageVehicle & {
    photos_count?: number;
    total_photos_count?: number;
  };

  return (
    extendedVehicle.photos_count ??
    extendedVehicle.total_photos_count ??
    photosLength
  );
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

function InfoCard({
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

function ConditionInfoCard({ condition }: { condition: VehicleCondition }) {
  return (
    <div
      className={`rounded-2xl px-4 py-3 ring-1 ${getConditionCardClass(
        condition
      )}`}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
        Seisund
      </p>

      <p
        className={`mt-1 text-sm font-bold ${getConditionTextClass(
          condition
        )}`}
      >
        {formatVehicleCondition(condition)}
      </p>
    </div>
  );
}

function VehiclePhotoCard({
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

function ManageVehicleDetailPage() {
  const { vehicleId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [vehicle, setVehicle] = useState<ManageVehicle | null>(null);
  const [vehiclePhotos, setVehiclePhotos] = useState<ManageVehiclePhoto[]>([]);
  const [cities, setCities] = useState<CityItem[]>([]);

  const [selectedPhoto, setSelectedPhoto] = useState<ManageVehiclePhoto | null>(
    null
  );
  const [photoToUpdate, setPhotoToUpdate] =
    useState<ManageVehiclePhoto | null>(null);

  const [isVehicleLoading, setIsVehicleLoading] = useState(true);
  const [isAddPhotoModalOpen, setIsAddPhotoModalOpen] = useState(false);
  const [isUpdateVehicleOpen, setIsUpdateVehicleOpen] = useState(false);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [photoToDelete, setPhotoToDelete] =
    useState<ManageVehiclePhoto | null>(null);
  const [isPhotoDeleteModalOpen, setIsPhotoDeleteModalOpen] = useState(false);
  const [isPhotoDeleting, setIsPhotoDeleting] = useState(false);

  const [vehicleToApprove, setVehicleToApprove] =
    useState<ManageVehicle | null>(null);
  const [isApprovingVehicle, setIsApprovingVehicle] = useState(false);

  const [vehicleToReject, setVehicleToReject] =
    useState<ManageVehicle | null>(null);
  const [vehicleRejectComment, setVehicleRejectComment] = useState("");
  const [isRejectingVehicle, setIsRejectingVehicle] = useState(false);

  const [vehicleToPending, setVehicleToPending] =
    useState<ManageVehicle | null>(null);
  const [isPendingVehicle, setIsPendingVehicle] = useState(false);

  const [photoToApprove, setPhotoToApprove] =
    useState<ManageVehiclePhoto | null>(null);
  const [isApprovingPhoto, setIsApprovingPhoto] = useState(false);

  const [photoToReject, setPhotoToReject] =
    useState<ManageVehiclePhoto | null>(null);
  const [photoRejectComment, setPhotoRejectComment] = useState("");
  const [isRejectingPhoto, setIsRejectingPhoto] = useState(false);

  const [photoToPending, setPhotoToPending] =
    useState<ManageVehiclePhoto | null>(null);
  const [isPendingPhoto, setIsPendingPhoto] = useState(false);

  const photosRef = useRef<HTMLDivElement | null>(null);
  const numericVehicleId = Number(vehicleId);

  const selectedPhotoIndex = selectedPhoto
    ? vehiclePhotos.findIndex(
        (photo) => photo.photo_id === selectedPhoto.photo_id
      )
    : -1;

  const loadVehicle = useCallback(async () => {
    if (Number.isNaN(numericVehicleId)) {
      navigate("/dashboard/manage/vehicles");
      return;
    }

    try {
      setIsVehicleLoading(true);

      const data = await getManageVehicleById(numericVehicleId);
      const nextPhotos = data.photos ?? [];

      setVehicle(data);
      setVehiclePhotos(nextPhotos);

      setSelectedPhoto((currentPhoto) => {
        if (!currentPhoto) {
          return null;
        }

        const stillExists = nextPhotos.find(
          (photo) => photo.photo_id === currentPhoto.photo_id
        );

        return stillExists ?? null;
      });

      setPhotoToUpdate((currentPhoto) => {
        if (!currentPhoto) {
          return null;
        }

        const stillExists = nextPhotos.find(
          (photo) => photo.photo_id === currentPhoto.photo_id
        );

        return stillExists ?? null;
      });
    } catch (error) {
      console.error(error);

      showToast({
        variant: "error",
        title: "Sõiduki laadimine ebaõnnestus",
        message: "Sõiduki detailvaadet ei õnnestunud laadida.",
      });

      navigate("/dashboard/manage/vehicles");
    } finally {
      setIsVehicleLoading(false);
    }
  }, [numericVehicleId, navigate, showToast]);

  useEffect(() => {
    loadVehicle();
  }, [loadVehicle]);

  useEffect(() => {
    async function loadCities() {
      try {
        const data = await getCities();
        setCities(data);
      } catch (error) {
        console.error(error);

        showToast({
          variant: "error",
          title: "Linnade laadimine ebaõnnestus",
          message: "Foto lisamise vormi jaoks ei õnnestunud linnu laadida.",
        });
      }
    }

    loadCities();
  }, [showToast]);

  const mainPhoto = vehiclePhotos[0];

  const mainImageUrl = mainPhoto?.file_path
    ? getCloudinaryImageUrl(mainPhoto.file_path, "w_1400,q_auto,f_auto")
    : "https://placehold.co/1400x850/e2e8f0/475569?text=TransitView";

  const previewPhotos = useMemo(() => {
    return vehiclePhotos;
  }, [vehiclePhotos]);

  function handlePreviousPhoto() {
    if (!selectedPhoto || previewPhotos.length <= 1) {
      return;
    }

    const currentIndex = previewPhotos.findIndex(
      (photo) => photo.photo_id === selectedPhoto.photo_id
    );

    const previousIndex =
      currentIndex <= 0 ? previewPhotos.length - 1 : currentIndex - 1;

    const previousPhoto = previewPhotos[previousIndex];

    if (previousPhoto) {
      setSelectedPhoto(previousPhoto);
    }
  }

  function handleNextPhoto() {
    if (!selectedPhoto || previewPhotos.length <= 1) {
      return;
    }

    const currentIndex = previewPhotos.findIndex(
      (photo) => photo.photo_id === selectedPhoto.photo_id
    );

    const nextIndex =
      currentIndex >= previewPhotos.length - 1 ? 0 : currentIndex + 1;

    const nextPhoto = previewPhotos[nextIndex];

    if (nextPhoto) {
      setSelectedPhoto(nextPhoto);
    }
  }

  function handlePhotoCreated() {
    setIsAddPhotoModalOpen(false);
    loadVehicle();

    window.setTimeout(() => {
      photosRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  }

  function handleOpenUpdateVehicleModal() {
    if (!vehicle) {
      return;
    }

    if (vehicle.status === "Kinnitatud") {
      showToast({
        variant: "error",
        title: "Muutmine pole lubatud",
        message: "Kinnitatud sõidukit ei saa muuta.",
      });

      return;
    }

    setIsUpdateVehicleOpen(true);
  }

  function handleCloseUpdateVehicleModal() {
    setIsUpdateVehicleOpen(false);
  }

  function handleVehicleUpdated() {
    setIsUpdateVehicleOpen(false);
    loadVehicle();
  }

  function handleOpenUpdatePhotoModal(photo: ManageVehiclePhoto) {
    if (photo.status === "Kinnitatud") {
      showToast({
        variant: "error",
        title: "Muutmine pole lubatud",
        message: "Kinnitatud fotot ei saa muuta.",
      });

      return;
    }

    setPhotoToUpdate(photo);
  }

  function handleCloseUpdatePhotoModal() {
    setPhotoToUpdate(null);
  }

  function handlePhotoUpdated() {
    setPhotoToUpdate(null);
    loadVehicle();
  }

  function handleOpenDeleteVehicleModal() {
    if (!vehicle) {
      return;
    }

    if (vehicle.status === "Kinnitatud") {
      showToast({
        variant: "error",
        title: "Kustutamine pole lubatud",
        message: "Kinnitatud sõidukit ei saa kustutada.",
      });

      return;
    }

    setIsDeleteModalOpen(true);
  }

  function handleCloseDeleteVehicleModal() {
    if (isDeleting) {
      return;
    }

    setIsDeleteModalOpen(false);
  }

  async function handleConfirmDeleteVehicle() {
    if (!vehicle) {
      return;
    }

    try {
      setIsDeleting(true);

      await deleteManageVehicle(vehicle.vehicle_id);

      showToast({
        variant: "success",
        title: "Sõiduk kustutatud",
        message: `Sõiduk ${vehicle.reg_number} ja seotud fotod kustutati.`,
      });

      navigate("/dashboard/manage/vehicles");
    } catch (error) {
      console.error(error);

      showToast({
        variant: "error",
        title: "Kustutamine ebaõnnestus",
        message: "Sõidukit ei õnnestunud kustutada.",
      });
    } finally {
      setIsDeleting(false);
    }
  }

  function handleOpenDeletePhotoModal(photo: ManageVehiclePhoto) {
    if (photo.status === "Kinnitatud") {
      showToast({
        variant: "error",
        title: "Kustutamine pole lubatud",
        message: "Kinnitatud fotot ei saa kustutada.",
      });

      return;
    }

    setPhotoToDelete(photo);
    setIsPhotoDeleteModalOpen(true);
  }

  function handleCloseDeletePhotoModal() {
    if (isPhotoDeleting) {
      return;
    }

    setIsPhotoDeleteModalOpen(false);
    setPhotoToDelete(null);
  }

  async function handleConfirmDeletePhoto() {
    if (!photoToDelete) {
      return;
    }

    try {
      setIsPhotoDeleting(true);

      await deleteManagePhoto(photoToDelete.photo_id);

      showToast({
        variant: "success",
        title: "Foto kustutatud",
        message: `Foto #${photoToDelete.photo_id} eemaldati edukalt.`,
      });

      if (selectedPhoto?.photo_id === photoToDelete.photo_id) {
        setSelectedPhoto(null);
      }

      if (photoToUpdate?.photo_id === photoToDelete.photo_id) {
        setPhotoToUpdate(null);
      }

      setIsPhotoDeleteModalOpen(false);
      setPhotoToDelete(null);

      loadVehicle();
    } catch (error) {
      console.error(error);

      showToast({
        variant: "error",
        title: "Kustutamine ebaõnnestus",
        message: "Fotot ei õnnestunud kustutada.",
      });
    } finally {
      setIsPhotoDeleting(false);
    }
  }

  function handleOpenApproveVehicleModal() {
    if (!vehicle) {
      return;
    }

    setVehicleToApprove(vehicle);
  }

  function handleCloseApproveVehicleModal() {
    if (isApprovingVehicle) {
      return;
    }

    setVehicleToApprove(null);
  }

  async function handleConfirmApproveVehicle() {
    if (!vehicleToApprove) {
      return;
    }

    try {
      setIsApprovingVehicle(true);

      await approveManageVehicle(vehicleToApprove.vehicle_id);

      showToast({
        variant: "success",
        title: "Sõiduk kinnitatud",
        message: `Sõiduk ${vehicleToApprove.reg_number} kinnitati.`,
      });

      setVehicleToApprove(null);
      loadVehicle();
    } catch (error) {
      console.error(error);

      showToast({
        variant: "error",
        title: "Kinnitamine ebaõnnestus",
        message: "Sõidukit ei õnnestunud kinnitada.",
      });
    } finally {
      setIsApprovingVehicle(false);
    }
  }

  function handleOpenRejectVehicleModal() {
    if (!vehicle) {
      return;
    }

    setVehicleRejectComment("");
    setVehicleToReject(vehicle);
  }

  function handleCloseRejectVehicleModal() {
    if (isRejectingVehicle) {
      return;
    }

    setVehicleToReject(null);
    setVehicleRejectComment("");
  }

  async function handleConfirmRejectVehicle() {
    if (!vehicleToReject || !vehicleRejectComment.trim()) {
      return;
    }

    try {
      setIsRejectingVehicle(true);

      await rejectManageVehicle(vehicleToReject.vehicle_id, {
        review_comment: vehicleRejectComment.trim(),
      });

      showToast({
        variant: "success",
        title: "Sõiduk tagasi lükatud",
        message: `Sõiduk ${vehicleToReject.reg_number} lükati tagasi.`,
      });

      setVehicleToReject(null);
      setVehicleRejectComment("");
      loadVehicle();
    } catch (error) {
      console.error(error);

      showToast({
        variant: "error",
        title: "Tagasilükkamine ebaõnnestus",
        message: "Sõidukit ei õnnestunud tagasi lükata.",
      });
    } finally {
      setIsRejectingVehicle(false);
    }
  }

  function handleOpenPendingVehicleModal() {
    if (!vehicle) {
      return;
    }

    setVehicleToPending(vehicle);
  }

  function handleClosePendingVehicleModal() {
    if (isPendingVehicle) {
      return;
    }

    setVehicleToPending(null);
  }

  async function handleConfirmPendingVehicle() {
    if (!vehicleToPending) {
      return;
    }

    try {
      setIsPendingVehicle(true);

      await pendingManageVehicle(vehicleToPending.vehicle_id);

      showToast({
        variant: "success",
        title: "Sõiduk pandi ootele",
        message: `Sõiduk ${vehicleToPending.reg_number} pandi tagasi ootele.`,
      });

      setVehicleToPending(null);
      loadVehicle();
    } catch (error) {
      console.error(error);

      showToast({
        variant: "error",
        title: "Staatuse muutmine ebaõnnestus",
        message: "Sõidukit ei õnnestunud tagasi ootele panna.",
      });
    } finally {
      setIsPendingVehicle(false);
    }
  }

  function handleOpenApprovePhotoModal(photo: ManageVehiclePhoto) {
    setPhotoToApprove(photo);
  }

  function handleCloseApprovePhotoModal() {
    if (isApprovingPhoto) {
      return;
    }

    setPhotoToApprove(null);
  }

  async function handleConfirmApprovePhoto() {
    if (!photoToApprove) {
      return;
    }

    try {
      setIsApprovingPhoto(true);

      await approveManagePhoto(photoToApprove.photo_id);

      showToast({
        variant: "success",
        title: "Foto kinnitatud",
        message: `Foto #${photoToApprove.photo_id} kinnitati.`,
      });

      setPhotoToApprove(null);
      loadVehicle();
    } catch (error) {
      console.error(error);

      showToast({
        variant: "error",
        title: "Kinnitamine ebaõnnestus",
        message: "Fotot ei õnnestunud kinnitada.",
      });
    } finally {
      setIsApprovingPhoto(false);
    }
  }

  function handleOpenRejectPhotoModal(photo: ManageVehiclePhoto) {
    setPhotoRejectComment("");
    setPhotoToReject(photo);
  }

  function handleCloseRejectPhotoModal() {
    if (isRejectingPhoto) {
      return;
    }

    setPhotoToReject(null);
    setPhotoRejectComment("");
  }

  async function handleConfirmRejectPhoto() {
    if (!photoToReject || !photoRejectComment.trim()) {
      return;
    }

    try {
      setIsRejectingPhoto(true);

      await rejectManagePhoto(photoToReject.photo_id, {
        review_comment: photoRejectComment.trim(),
      });

      showToast({
        variant: "success",
        title: "Foto tagasi lükatud",
        message: `Foto #${photoToReject.photo_id} lükati tagasi.`,
      });

      setPhotoToReject(null);
      setPhotoRejectComment("");
      loadVehicle();
    } catch (error) {
      console.error(error);

      showToast({
        variant: "error",
        title: "Tagasilükkamine ebaõnnestus",
        message: "Fotot ei õnnestunud tagasi lükata.",
      });
    } finally {
      setIsRejectingPhoto(false);
    }
  }

  function handleOpenPendingPhotoModal(photo: ManageVehiclePhoto) {
    setPhotoToPending(photo);
  }

  function handleClosePendingPhotoModal() {
    if (isPendingPhoto) {
      return;
    }

    setPhotoToPending(null);
  }

  async function handleConfirmPendingPhoto() {
    if (!photoToPending) {
      return;
    }

    try {
      setIsPendingPhoto(true);

      await pendingManagePhoto(photoToPending.photo_id);

      showToast({
        variant: "success",
        title: "Foto pandi ootele",
        message: `Foto #${photoToPending.photo_id} pandi tagasi ootele.`,
      });

      setPhotoToPending(null);
      loadVehicle();
    } catch (error) {
      console.error(error);

      showToast({
        variant: "error",
        title: "Staatuse muutmine ebaõnnestus",
        message: "Fotot ei õnnestunud tagasi ootele panna.",
      });
    } finally {
      setIsPendingPhoto(false);
    }
  }

  if (isVehicleLoading) {
    return (
      <div className="space-y-8">
        <div className="h-44 animate-pulse rounded-3xl bg-white ring-1 ring-slate-200" />

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(360px,0.9fr)]">
          <div className="h-[520px] animate-pulse rounded-[32px] bg-white ring-1 ring-slate-200" />
          <div className="h-[520px] animate-pulse rounded-[32px] bg-white ring-1 ring-slate-200" />
        </div>
      </div>
    );
  }

  if (!vehicle) {
    return null;
  }

  const canModify = vehicle.status !== "Kinnitatud";
  const canOpenPublicView = vehicle.status === "Kinnitatud";
  const canApproveVehicle = vehicle.status !== "Kinnitatud";
  const canPendingVehicle =
    vehicle.status === "Kinnitatud" || vehicle.status === "Tagasi_lukatud";
  const canRejectVehicle = vehicle.status !== "Tagasi_lukatud";
  const canAddPhoto = true;

  const branchLocation = vehicle.branch?.city
    ? `${vehicle.branch.city.name}, ${vehicle.branch.city.county.name}`
    : "Filiaal puudub";

  const companyName = vehicle.branch?.company?.name ?? "Ettevõte puudub";
  const branchName = vehicle.branch?.branch_name ?? "Filiaal puudub";
  const photosCount = getPhotosCount(vehicle, vehiclePhotos.length);

  return (
    <div className="space-y-8">
      <DashboardPageHeader
        eyebrow="Sõiduki detailid"
        title={vehicle.reg_number}
        description={`${vehicle.model.manufacturer} ${vehicle.model.name}`}
      />

      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <Link
            to="/dashboard/manage/vehicles"
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            <ArrowLeft size={18} />
            Tagasi sõidukite haldusesse
          </Link>

          <Link
            to="/dashboard/manage/photos"
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            <Images size={18} />
            Tagasi fotode haldusesse
          </Link>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          {canOpenPublicView && (
            <Link
              to={`/vehicles/${vehicle.vehicle_id}`}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              <ShieldCheck size={18} />
              Avalik vaade
            </Link>
          )}

          {canAddPhoto && (
            <button
              type="button"
              onClick={() => setIsAddPhotoModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(37,99,235,0.22)] transition hover:bg-blue-700"
            >
              <Plus size={18} />
              Lisa foto
            </button>
          )}

          {canModify && (
            <>
              <button
                type="button"
                onClick={handleOpenUpdateVehicleModal}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
              >
                <Pencil size={18} />
                Muuda
              </button>

              <button
                type="button"
                onClick={handleOpenDeleteVehicleModal}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-rose-50 px-5 py-3 text-sm font-semibold text-rose-600 transition hover:bg-rose-100"
              >
                <Trash2 size={18} />
                Kustuta
              </button>
            </>
          )}

          {canApproveVehicle && (
            <button
              type="button"
              onClick={handleOpenApproveVehicleModal}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              <CheckCircle2 size={18} />
              Kinnita
            </button>
          )}

          {canPendingVehicle && (
            <button
              type="button"
              onClick={handleOpenPendingVehicleModal}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-50 px-5 py-3 text-sm font-semibold text-amber-700 transition hover:bg-amber-100"
            >
              <Clock3 size={18} />
              Pane ootele
            </button>
          )}

          {canRejectVehicle && (
            <button
              type="button"
              onClick={handleOpenRejectVehicleModal}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-orange-50 px-5 py-3 text-sm font-semibold text-orange-700 transition hover:bg-orange-100"
            >
              <XCircle size={18} />
              Lükka tagasi
            </button>
          )}
        </div>
      </div>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(360px,0.9fr)]">
        <article className="overflow-hidden rounded-[32px] bg-white shadow-[0_18px_50px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/70">
          <div className="relative aspect-[16/10] overflow-hidden bg-slate-200">
            <img
              src={mainImageUrl}
              alt={vehicle.reg_number}
              className="h-full w-full object-cover"
            />

            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/85 via-slate-950/35 to-transparent px-6 pb-6 pt-20">
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-3xl font-bold text-white">
                  {vehicle.reg_number}
                </p>

                <ReviewStatusBadge status={vehicle.status} />
              </div>

              <p className="mt-2 text-sm font-semibold text-slate-200">
                {vehicle.model.category.name}
              </p>
            </div>
          </div>

          <div className="grid gap-3 p-5 sm:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 text-blue-600" size={18} />

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Foto asukoht
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {getPhotoLocation(mainPhoto)}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
              <div className="flex items-start gap-3">
                <CalendarDays className="mt-0.5 text-blue-600" size={18} />

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Pildistatud
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {getPhotoDate(mainPhoto)}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
              <div className="flex items-start gap-3">
                <Camera className="mt-0.5 text-blue-600" size={18} />

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Fotosid
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {photosCount}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </article>

        <aside className="rounded-[32px] bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/70 sm:p-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-600">
              Andmed
            </p>

            <h2 className="mt-2 text-2xl font-bold text-slate-900">
              Sõiduki info
            </h2>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <InfoCard label="Registrinumber" value={vehicle.reg_number} />
            <ConditionInfoCard condition={vehicle.condition} />

            <InfoCard label="Väljalaskeaasta" value={vehicle.vla_year} />
            <InfoCard label="Kategooria" value={vehicle.model.category.name} />

            <InfoCard label="Tootja" value={vehicle.model.manufacturer} />
            <InfoCard label="Mudel" value={vehicle.model.name} />

            <InfoCard label="VIN-kood" value={vehicle.vin_code} />
            <InfoCard label="Šassii" value={vehicle.chassis} />

            <InfoCard label="Ettevõte" value={companyName} />
            <InfoCard label="Filiaal" value={branchName} />

            <InfoCard label="Filiaali asukoht" value={branchLocation} />
            <InfoCard label="Lisatud" value={formatDate(vehicle.created_at)} />

            {vehicle.creator && (
              <div className="rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200 sm:col-span-2">
                <div className="flex items-start gap-3">
                  <User className="mt-0.5 text-blue-600" size={18} />

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Lisas kasutaja
                    </p>

                    <p className="mt-1 text-sm font-semibold text-slate-800">
                      {getUserLabel(vehicle.creator)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {vehicle.reviewer && (
              <div className="rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200 sm:col-span-2">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 text-blue-600" size={18} />

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Modereeris
                    </p>

                    <p className="mt-1 text-sm font-semibold text-slate-800">
                      {getUserLabel(vehicle.reviewer)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {vehicle.review_comment && (
            <div className="mt-5 rounded-2xl bg-rose-50 p-4 text-sm font-medium text-rose-700 ring-1 ring-rose-100">
              <span className="font-bold">Kommentaar: </span>
              {vehicle.review_comment}
            </div>
          )}
        </aside>
      </section>

      <section ref={photosRef} className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
              Fotod
            </p>

            <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
              Sõiduki fotod
            </h2>

            <p className="mt-2 max-w-2xl text-sm text-slate-500">
              Siin kuvatakse kõik selle sõidukiga seotud fotod.
            </p>
          </div>

          <div className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-600 shadow-[0_12px_30px_rgba(15,23,42,0.06)] ring-1 ring-slate-200">
            Leitud fotosid:{" "}
            <span className="font-bold text-slate-900">
              {vehiclePhotos.length}
            </span>
            <span className="mx-2 text-slate-300">/</span>
            Kokku:{" "}
            <span className="font-bold text-slate-900">{photosCount}</span>
          </div>
        </div>

        {vehiclePhotos.length > 0 ? (
          <div className="grid gap-6">
            {vehiclePhotos.map((photo, index) => (
              <div
                key={photo.photo_id}
                className="animate-card-in"
                style={{
                  animationDelay: `${index * 50}ms`,
                }}
              >
                <VehiclePhotoCard
                  photo={photo}
                  isFirstPhoto={index === 0}
                  onPreview={setSelectedPhoto}
                  onEdit={handleOpenUpdatePhotoModal}
                  onDelete={handleOpenDeletePhotoModal}
                  onApprove={handleOpenApprovePhotoModal}
                  onReject={handleOpenRejectPhotoModal}
                  onPending={handleOpenPendingPhotoModal}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-[28px] bg-white px-6 py-10 text-center shadow-[0_18px_50px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/70">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100 text-slate-400">
              <Camera size={30} />
            </div>

            <p className="mt-5 text-lg font-semibold text-slate-800">
              Fotosid ei leitud
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Selle sõidukiga ei ole hetkel seotud fotosid.
            </p>
          </div>
        )}
      </section>

      <AddPhotoModal
        isOpen={isAddPhotoModalOpen}
        vehicleId={vehicle.vehicle_id}
        cities={cities}
        onClose={() => setIsAddPhotoModalOpen(false)}
        onSuccess={handlePhotoCreated}
      />

      <UpdateVehicleModal
        isOpen={isUpdateVehicleOpen}
        vehicle={vehicle as unknown as DashboardVehicle}
        onClose={handleCloseUpdateVehicleModal}
        onSuccess={handleVehicleUpdated}
        onUpdateVehicle={(vehicleId, data) =>
          updateManageVehicle(
            vehicleId,
            data as Parameters<typeof updateManageVehicle>[1]
          )
        }
        onUpdateFirstPhoto={(photoId, data) =>
          updateManagePhoto(
            photoId,
            data as Parameters<typeof updateManagePhoto>[1]
          )
        }
      />

      <UpdatePhotoModal
        isOpen={Boolean(photoToUpdate)}
        photo={photoToUpdate as unknown as DashboardVehiclePhoto | null}
        cities={cities}
        onClose={handleCloseUpdatePhotoModal}
        onSuccess={handlePhotoUpdated}
        onUpdatePhoto={(photoId, data) =>
          updateManagePhoto(
            photoId,
            data as Parameters<typeof updateManagePhoto>[1]
          )
        }
      />

      <PhotoPreviewModal
        isOpen={!!selectedPhoto}
        photo={selectedPhoto as unknown as DashboardVehiclePhoto | null}
        vehicle={vehicle as unknown as DashboardVehicle}
        photos={previewPhotos as unknown as DashboardVehiclePhoto[]}
        currentIndex={selectedPhotoIndex >= 0 ? selectedPhotoIndex : 0}
        onClose={() => setSelectedPhoto(null)}
        onPrevious={handlePreviousPhoto}
        onNext={handleNextPhoto}
        showVehicleLink={canOpenPublicView}
        vehicleLink={`/vehicles/${vehicle.vehicle_id}`}
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        title="Kustuta sõiduk"
        message={`Kas oled kindel, et soovid kustutada sõiduki ${vehicle.reg_number}? Koos sõidukiga kustutatakse ka kõik selle sõidukiga seotud fotod.`}
        confirmLabel="Kustuta sõiduk"
        isLoading={isDeleting}
        onClose={handleCloseDeleteVehicleModal}
        onConfirm={handleConfirmDeleteVehicle}
      />

      <DeleteConfirmModal
        isOpen={isPhotoDeleteModalOpen}
        title="Kustuta foto"
        message={
          photoToDelete
            ? `Kas oled kindel, et soovid kustutada foto #${photoToDelete.photo_id}?`
            : "Kas oled kindel, et soovid selle foto kustutada?"
        }
        confirmLabel="Kustuta foto"
        isLoading={isPhotoDeleting}
        onClose={handleCloseDeletePhotoModal}
        onConfirm={handleConfirmDeletePhoto}
      />

      <ApproveConfirmModal
        isOpen={Boolean(vehicleToApprove)}
        title="Kinnita sõiduk"
        message={
          vehicleToApprove
            ? `Kas oled kindel, et soovid kinnitada sõiduki ${vehicleToApprove.reg_number}? Pärast kinnitamist kuvatakse see avalikus vaates.`
            : "Kas oled kindel, et soovid selle sõiduki kinnitada?"
        }
        confirmLabel="Kinnita sõiduk"
        isLoading={isApprovingVehicle}
        onClose={handleCloseApproveVehicleModal}
        onConfirm={handleConfirmApproveVehicle}
      />

      <PendingConfirmModal
        isOpen={Boolean(vehicleToPending)}
        title="Pane sõiduk ootele"
        message={
          vehicleToPending
            ? `Kas oled kindel, et soovid sõiduki ${vehicleToPending.reg_number} tagasi ootele panna?`
            : "Kas oled kindel, et soovid selle sõiduki tagasi ootele panna?"
        }
        confirmLabel="Pane ootele"
        isLoading={isPendingVehicle}
        onClose={handleClosePendingVehicleModal}
        onConfirm={handleConfirmPendingVehicle}
      />

      <RejectReasonModal
        isOpen={Boolean(vehicleToReject)}
        title="Lükka sõiduk tagasi"
        message={
          vehicleToReject
            ? `Sõiduk ${vehicleToReject.reg_number} lükatakse tagasi. Lisa kasutajale põhjus.`
            : "Lisa põhjus, miks sõiduk tagasi lükatakse."
        }
        comment={vehicleRejectComment}
        confirmLabel="Lükka sõiduk tagasi"
        isLoading={isRejectingVehicle}
        onCommentChange={setVehicleRejectComment}
        onClose={handleCloseRejectVehicleModal}
        onConfirm={handleConfirmRejectVehicle}
      />

      <ApproveConfirmModal
        isOpen={Boolean(photoToApprove)}
        title="Kinnita foto"
        message={
          photoToApprove
            ? `Kas oled kindel, et soovid kinnitada foto #${photoToApprove.photo_id}? Pärast kinnitamist saab see avalikus vaates nähtavaks.`
            : "Kas oled kindel, et soovid selle foto kinnitada?"
        }
        confirmLabel="Kinnita foto"
        isLoading={isApprovingPhoto}
        onClose={handleCloseApprovePhotoModal}
        onConfirm={handleConfirmApprovePhoto}
      />

      <PendingConfirmModal
        isOpen={Boolean(photoToPending)}
        title="Pane foto ootele"
        message={
          photoToPending
            ? `Kas oled kindel, et soovid foto #${photoToPending.photo_id} tagasi ootele panna?`
            : "Kas oled kindel, et soovid selle foto tagasi ootele panna?"
        }
        confirmLabel="Pane ootele"
        isLoading={isPendingPhoto}
        onClose={handleClosePendingPhotoModal}
        onConfirm={handleConfirmPendingPhoto}
      />

      <RejectReasonModal
        isOpen={Boolean(photoToReject)}
        title="Lükka foto tagasi"
        message={
          photoToReject
            ? `Foto #${photoToReject.photo_id} lükatakse tagasi. Lisa kasutajale põhjus.`
            : "Lisa põhjus, miks foto tagasi lükatakse."
        }
        comment={photoRejectComment}
        confirmLabel="Lükka foto tagasi"
        isLoading={isRejectingPhoto}
        onCommentChange={setPhotoRejectComment}
        onClose={handleCloseRejectPhotoModal}
        onConfirm={handleConfirmRejectPhoto}
      />
    </div>
  );
}

export default ManageVehicleDetailPage;