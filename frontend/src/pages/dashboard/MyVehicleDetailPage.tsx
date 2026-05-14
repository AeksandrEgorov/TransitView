// This page shows a user's own vehicle with all its photos.
// It lets the owner edit pending/rejected content and add or remove related photos.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  Camera,
  Images,
  MapPin,
  Pencil,
  Plus,
  ShieldCheck,
  Trash2,
  User,
} from "lucide-react";

import DashboardPageHeader from "../../components/dashboard/DashboardPageHeader";
import ReviewStatusBadge from "../../components/dashboard/ReviewStatusBadge";
import {
  ConditionInfoCard,
  InfoCard,
  VehiclePhotoCard,
} from "../../components/dashboard/my-vehicle-detail/VehicleDetailCards";
import AddPhotoModal from "../../components/modals/photos/AddPhotoModal";
import UpdateVehicleModal from "../../components/modals/vehicles/UpdateVehicleModal";
import UpdatePhotoModal from "../../components/modals/photos/UpdatePhotoModal";
import PhotoPreviewModal from "../../components/modals/photos/PhotoPreviewModal";
import DeleteConfirmModal from "../../components/modals/confirm/DeleteConfirmModal";

import {
  deleteMyPhoto,
  deleteMyVehicle,
  getMyVehicleById,
} from "../../config/dashboardApi";
import { getCities } from "../../config/referenceApi";

import { useToast } from "../../hooks/useToast";
import { reportError } from "../../utils/logger";
import { getCloudinaryImageUrl } from "../../utils/cloudinary";

import type { CityItem } from "../../types/reference";
import type {
  DashboardVehicle,
  DashboardVehiclePhoto,
} from "../../types/dashboard";

function formatDate(dateString?: string | null) {
  if (!dateString) {
    return "Teadmata";
  }

  return new Date(dateString).toLocaleDateString("et-EE");
}

function getPhotoLocation(photo?: DashboardVehiclePhoto | null) {
  if (!photo?.city) {
    return "Asukoht teadmata";
  }

  return `${photo.city.name}, ${photo.city.county.name}`;
}

function getPhotoDate(photo?: DashboardVehiclePhoto | null) {
  if (!photo?.taken_at) {
    return "Kuupäev teadmata";
  }

  return formatDate(photo.taken_at);
}

function MyVehicleDetailPage() {
  const { vehicleId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [vehicle, setVehicle] = useState<DashboardVehicle | null>(null);
  const [vehiclePhotos, setVehiclePhotos] = useState<DashboardVehiclePhoto[]>(
    []
  );
  const [cities, setCities] = useState<CityItem[]>([]);

  const [selectedPhoto, setSelectedPhoto] =
    useState<DashboardVehiclePhoto | null>(null);
  const [photoToUpdate, setPhotoToUpdate] =
    useState<DashboardVehiclePhoto | null>(null);

  const [isVehicleLoading, setIsVehicleLoading] = useState(true);
  const [isAddPhotoModalOpen, setIsAddPhotoModalOpen] = useState(false);
  const [isUpdateVehicleOpen, setIsUpdateVehicleOpen] = useState(false);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [photoToDelete, setPhotoToDelete] =
    useState<DashboardVehiclePhoto | null>(null);
  const [isPhotoDeleteModalOpen, setIsPhotoDeleteModalOpen] = useState(false);
  const [isPhotoDeleting, setIsPhotoDeleting] = useState(false);

  const photosRef = useRef<HTMLDivElement | null>(null);
  const numericVehicleId = Number(vehicleId);

  const selectedPhotoIndex = selectedPhoto
    ? vehiclePhotos.findIndex(
        (photo) => photo.photo_id === selectedPhoto.photo_id
      )
    : -1;

  const loadVehicle = useCallback(async () => {
    if (Number.isNaN(numericVehicleId)) {
      navigate("/dashboard/vehicles");
      return;
    }

    try {
      setIsVehicleLoading(true);

      const data = await getMyVehicleById(numericVehicleId);

      setVehicle(data);
      setVehiclePhotos(data.photos ?? []);

      setSelectedPhoto((currentPhoto) => {
        if (!currentPhoto) {
          return null;
        }

        const stillExists = data.photos.find(
          (photo) => photo.photo_id === currentPhoto.photo_id
        );

        return stillExists ?? null;
      });

      setPhotoToUpdate((currentPhoto) => {
        if (!currentPhoto) {
          return null;
        }

        const stillExists = data.photos.find(
          (photo) => photo.photo_id === currentPhoto.photo_id
        );

        return stillExists ?? null;
      });
    } catch (error) {
      reportError(error);

      showToast({
        variant: "error",
        title: "Sõiduki laadimine ebaõnnestus",
        message: "Sõiduki detailvaadet ei õnnestunud laadida.",
      });

      navigate("/dashboard/vehicles");
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
        reportError(error);

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

  function handleOpenUpdatePhotoModal(photo: DashboardVehiclePhoto) {
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

      await deleteMyVehicle(vehicle.vehicle_id);

      showToast({
        variant: "success",
        title: "Sõiduk kustutatud",
        message: `Sõiduk ${vehicle.reg_number} ja seotud fotod kustutati.`,
      });

      navigate("/dashboard/vehicles");
    } catch (error) {
      reportError(error);

      showToast({
        variant: "error",
        title: "Kustutamine ebaõnnestus",
        message: "Sõidukit ei õnnestunud kustutada.",
      });
    } finally {
      setIsDeleting(false);
    }
  }

  function handleOpenDeletePhotoModal(photo: DashboardVehiclePhoto) {
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

      await deleteMyPhoto(photoToDelete.photo_id);

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
      reportError(error);

      showToast({
        variant: "error",
        title: "Kustutamine ebaõnnestus",
        message: "Fotot ei õnnestunud kustutada.",
      });
    } finally {
      setIsPhotoDeleting(false);
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
  const canAddPhoto = true;

  const branchLocation = vehicle.branch?.city
    ? `${vehicle.branch.city.name}, ${vehicle.branch.city.county.name}`
    : "Filiaal puudub";

  const companyName = vehicle.branch?.company?.name ?? "Ettevõte puudub";
  const branchName = vehicle.branch?.branch_name ?? "Filiaal puudub";
  const photosCount = vehicle.photos_count ?? vehiclePhotos.length;

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
            to="/dashboard/vehicles"
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            <ArrowLeft size={18} />
            Tagasi minu sõidukite juurde
          </Link>

          <Link
            to="/dashboard/photos"
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            <Images size={18} />
            Tagasi minu fotode juurde
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
                      {vehicle.creator.username}
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
              Siin kuvatakse kõik selle sõidukiga seotud sinu nähtavad fotod.
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
        vehicle={vehicle}
        onClose={handleCloseUpdateVehicleModal}
        onSuccess={handleVehicleUpdated}
      />

      <UpdatePhotoModal
        isOpen={Boolean(photoToUpdate)}
        photo={photoToUpdate}
        cities={cities}
        onClose={handleCloseUpdatePhotoModal}
        onSuccess={handlePhotoUpdated}
      />

      <PhotoPreviewModal
        isOpen={!!selectedPhoto}
        photo={selectedPhoto}
        vehicle={vehicle}
        photos={previewPhotos}
        currentIndex={selectedPhotoIndex >= 0 ? selectedPhotoIndex : 0}
        onClose={() => setSelectedPhoto(null)}
        onPrevious={handlePreviousPhoto}
        onNext={handleNextPhoto}
        showVehicleLink={canOpenPublicView}
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
    </div>
  );
}

export default MyVehicleDetailPage;
