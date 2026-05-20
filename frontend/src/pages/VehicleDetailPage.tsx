// This page shows one public vehicle in detail.
// It loads the approved vehicle, its photo list, and lets visitors open photo previews.

import { Link, useParams } from "react-router-dom";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ArrowLeft,
  CalendarDays,
  Camera,
  Images,
  MapPin,
  Plus,
  User,
} from "lucide-react";

import { getVehicleById } from "../config/vehicleApi";
import { getPhotosByVehicleId } from "../config/photoApi";
import { getCities } from "../config/referenceApi";
import PageHero from "../components/ui/PageHero";
import AddPhotoModal from "../components/modals/photos/AddPhotoModal";
import PhotoPreviewModal from "../components/modals/photos/PhotoPreviewModal";
import { useToast } from "../hooks/useToast";
import { reportError } from "../utils/logger";
import { useAuth } from "../hooks/useAuth";
import type { CityItem } from "../types/reference";
import type { VehicleItem, VehiclePhoto } from "../types/vehicle";
import { formatVehicleCondition } from "../utils/formatters";
import { getCloudinaryImageUrl } from "../utils/cloudinary";
import { getConditionStyles } from "../utils/conditionStyles";

function formatDate(dateString?: string | null) {
  if (!dateString) {
    return "Teadmata";
  }

  return new Date(dateString).toLocaleDateString("et-EE");
}

function getPhotoLocation(photo?: VehiclePhoto | null) {
  if (!photo?.city) {
    return "Asukoht teadmata";
  }

  return `${photo.city.name}, ${photo.city.county.name}`;
}

function getPhotoDate(photo?: VehiclePhoto | null) {
  if (!photo?.taken_at) {
    return "Kuupäev teadmata";
  }

  return formatDate(photo.taken_at);
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

function ConditionInfoCard({
  condition,
}: {
  condition: VehicleItem["condition"];
}) {
  return (
    <div
      className={`rounded-2xl px-4 py-3 ring-1 ${getConditionStyles(
        condition
      )}`}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-current opacity-70">
        Seisund
      </p>

      <p className="mt-1 text-sm font-bold">
        {formatVehicleCondition(condition)}
      </p>
    </div>
  );
}

function VehiclePhotoCard({
  photo,
  isFirstPhoto,
  onPreview,
}: {
  photo: VehiclePhoto;
  isFirstPhoto: boolean;
  onPreview: (photo: VehiclePhoto) => void;
}) {
  const photoUrl = getCloudinaryImageUrl(
    photo.file_path,
    "w_700,h_450,c_fill,q_auto,f_auto"
  );

  return (
    <article className="group overflow-hidden rounded-3xl bg-white shadow-[0_18px_50px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/70 transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_60px_rgba(15,23,42,0.12)]">
      <button
        type="button"
        onClick={() => onPreview(photo)}
        className="block w-full text-left"
      >
        <div className="relative aspect-[16/10] overflow-hidden bg-slate-200">
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

          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/85 via-slate-950/35 to-transparent px-4 pb-4 pt-12">
            <p className="text-sm font-semibold text-white">
              {getPhotoLocation(photo)}
            </p>

            {photo.place && (
              <p className="mt-1 text-xs font-medium text-slate-200">
                {photo.place}
              </p>
            )}
          </div>
        </div>
      </button>

      <div className="space-y-4 p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <InfoCard label="Asukoht" value={getPhotoLocation(photo)} />
          <InfoCard label="Lisatud" value={formatDate(photo.created_at)} />
        </div>

        {(photo.place || photo.author) && (
          <div className="grid gap-3 sm:grid-cols-2">
            {photo.place && <InfoCard label="Koht" value={photo.place} />}

            {photo.author && (
              <InfoCard label="Autor" value={photo.author.username} />
            )}
          </div>
        )}

        <button
          type="button"
          onClick={() => onPreview(photo)}
          className="w-full rounded-2xl bg-blue-600 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          Vaata fotot
        </button>
      </div>
    </article>
  );
}

function VehicleDetailPage() {
  const { id } = useParams();
  const { showToast } = useToast();
  const { user, isAuthenticated } = useAuth();

  const [vehicle, setVehicle] = useState<VehicleItem | null>(null);
  const [vehiclePhotos, setVehiclePhotos] = useState<VehiclePhoto[]>([]);
  const [cities, setCities] = useState<CityItem[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<VehiclePhoto | null>(null);

  const [isVehicleLoading, setIsVehicleLoading] = useState(true);
  const [isPhotosLoading, setIsPhotosLoading] = useState(true);

  const [photoPage, setPhotoPage] = useState(1);
  const [photoTotalPages, setPhotoTotalPages] = useState(1);
  const [photoTotal, setPhotoTotal] = useState(0);

  const [isAddPhotoModalOpen, setIsAddPhotoModalOpen] = useState(false);

  const photosLimit = 12;
  const photosRef = useRef<HTMLDivElement | null>(null);
  const vehicleId = Number(id);

  const canAddPhoto =
    isAuthenticated &&
    !!vehicle &&
    !!user &&
    (vehicle.creator?.user_id === user.user_id ||
      user.role === "Andmebaasi_toimetaja" ||
      user.role === "Administraator");

  const selectedPhotoIndex = selectedPhoto
    ? vehiclePhotos.findIndex(
        (photo) => photo.photo_id === selectedPhoto.photo_id
      )
    : -1;

  const loadVehicle = useCallback(async () => {
    if (Number.isNaN(vehicleId)) {
      setIsVehicleLoading(false);
      return;
    }

    try {
      setIsVehicleLoading(true);

      const data = await getVehicleById(vehicleId);
      setVehicle(data);
    } catch (error) {
      reportError(error);

      showToast({
        variant: "error",
        title: "Sõiduki laadimine ebaõnnestus",
        message: "Sõiduki andmeid ei õnnestunud laadida.",
      });
    } finally {
      setIsVehicleLoading(false);
    }
  }, [vehicleId, showToast]);

  const loadPhotos = useCallback(async () => {
    if (Number.isNaN(vehicleId)) {
      setIsPhotosLoading(false);
      return;
    }

    try {
      setIsPhotosLoading(true);

      const data = await getPhotosByVehicleId(vehicleId, {
        page: photoPage,
        limit: photosLimit,
      });

      setVehiclePhotos(data.items);
      setPhotoTotalPages(Math.max(data.meta.totalPages, 1));
      setPhotoTotal(data.meta.total);

      setSelectedPhoto((currentPhoto) => {
        if (!currentPhoto) {
          return null;
        }

        const stillExists = data.items.find(
          (photo) => photo.photo_id === currentPhoto.photo_id
        );

        return stillExists ?? null;
      });
    } catch (error) {
      reportError(error);

      showToast({
        variant: "error",
        title: "Fotode laadimine ebaõnnestus",
        message: "Sõiduki fotosid ei õnnestunud laadida.",
      });
    } finally {
      setIsPhotosLoading(false);
    }
  }, [vehicleId, photoPage, showToast]);

  useEffect(() => {
    loadVehicle();
  }, [loadVehicle]);

  useEffect(() => {
    loadPhotos();
  }, [loadPhotos]);

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
          message:
            "Foto lisamise vormi jaoks ei õnnestunud linnu laadida.",
        });
      }
    }

    if (isAuthenticated) {
      loadCities();
    }
  }, [isAuthenticated, showToast]);

  const mainPhoto = vehiclePhotos[0] ?? vehicle?.photos[0];

  const mainImageUrl = mainPhoto?.file_path
    ? getCloudinaryImageUrl(mainPhoto.file_path, "w_1400,q_auto,f_auto")
    : "https://placehold.co/1400x850/e2e8f0/475569?text=TransitView";

  const photoPageNumbers = useMemo(() => {
    return Array.from({ length: photoTotalPages }, (_, index) => index + 1);
  }, [photoTotalPages]);

  function handlePhotoPageChange(newPage: number) {
    if (
      newPage === photoPage ||
      newPage < 1 ||
      newPage > photoTotalPages
    ) {
      return;
    }

    setSelectedPhoto(null);
    setPhotoPage(newPage);

    window.setTimeout(() => {
      photosRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  }

  function handlePreviousPhoto() {
    if (!selectedPhoto || vehiclePhotos.length <= 1) {
      return;
    }

    const currentIndex = vehiclePhotos.findIndex(
      (photo) => photo.photo_id === selectedPhoto.photo_id
    );

    const previousIndex =
      currentIndex <= 0 ? vehiclePhotos.length - 1 : currentIndex - 1;

    setSelectedPhoto(vehiclePhotos[previousIndex]);
  }

  function handleNextPhoto() {
    if (!selectedPhoto || vehiclePhotos.length <= 1) {
      return;
    }

    const currentIndex = vehiclePhotos.findIndex(
      (photo) => photo.photo_id === selectedPhoto.photo_id
    );

    const nextIndex =
      currentIndex >= vehiclePhotos.length - 1 ? 0 : currentIndex + 1;

    setSelectedPhoto(vehiclePhotos[nextIndex]);
  }

  function handlePhotoCreated() {
    if (photoPage === 1) {
      loadPhotos();
    } else {
      setPhotoPage(1);
    }
  }

  if (Number.isNaN(vehicleId)) {
    return (
      <div className="space-y-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 transition hover:text-blue-700"
        >
          <ArrowLeft size={18} />
          Tagasi avalehele
        </Link>

        <div className="rounded-3xl bg-white p-8 text-center shadow-[0_18px_50px_rgba(15,23,42,0.08)] ring-1 ring-slate-200">
          <h1 className="text-2xl font-bold text-slate-900">
            Vigane sõiduki ID
          </h1>
        </div>
      </div>
    );
  }

  if (isVehicleLoading) {
    return (
      <div className="space-y-8">
        <div className="h-10 w-40 animate-pulse rounded-2xl bg-slate-200" />

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(360px,0.9fr)]">
          <div className="h-[520px] animate-pulse rounded-[32px] bg-slate-200" />
          <div className="h-[520px] animate-pulse rounded-[32px] bg-slate-200" />
        </div>

        <div className="grid gap-6 md:grid-cols-2 2xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-[360px] animate-pulse rounded-3xl bg-slate-200"
            />
          ))}
        </div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="space-y-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 transition hover:text-blue-700"
        >
          <ArrowLeft size={18} />
          Tagasi avalehele
        </Link>

        <div className="rounded-3xl bg-white p-8 text-center shadow-[0_18px_50px_rgba(15,23,42,0.08)] ring-1 ring-slate-200">
          <h1 className="text-2xl font-bold text-slate-900">
            Sõidukit ei leitud
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Sõiduk võib olla eemaldatud või ei ole avalikult nähtav.
          </p>
        </div>
      </div>
    );
  }

  const branchLocation = vehicle.branch
    ? `${vehicle.branch.city.name}, ${vehicle.branch.city.county.name}`
    : "Filiaal puudub";

  const companyName = vehicle.branch?.company.name ?? "Ettevõte puudub";
  const branchName = vehicle.branch?.branch_name ?? "Filiaal puudub";

  return (
    <div className="space-y-8">
      <PageHero
        eyebrow="Sõiduki detailid"
        title={vehicle.reg_number}
        description={`${vehicle.model.manufacturer} ${vehicle.model.name}`}
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            <ArrowLeft size={18} />
            Tagasi avalehele
          </Link>

          <Link
            to="/gallery"
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            <Images size={18} />
            Tagasi galeriisse
          </Link>
        </div>

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
              <p className="text-3xl font-bold text-white">
                {vehicle.reg_number}
              </p>

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
                    {photoTotal}
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
              Siin kuvatakse selle sõidukiga seotud kinnitatud fotod.
            </p>
          </div>

          <div className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-600 shadow-[0_12px_30px_rgba(15,23,42,0.06)] ring-1 ring-slate-200">
            Leitud fotosid:{" "}
            <span className="font-bold text-slate-900">
              {vehiclePhotos.length}
            </span>
            <span className="mx-2 text-slate-300">/</span>
            Kokku:{" "}
            <span className="font-bold text-slate-900">{photoTotal}</span>
          </div>
        </div>

        {isPhotosLoading ? (
          <div className="grid gap-6 md:grid-cols-2 2xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="overflow-hidden rounded-3xl bg-white shadow-[0_18px_50px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/70"
              >
                <div className="aspect-[16/10] animate-pulse bg-slate-200" />

                <div className="space-y-3 p-5">
                  <div className="h-6 animate-pulse rounded-xl bg-slate-200" />
                  <div className="h-4 animate-pulse rounded-xl bg-slate-200" />
                  <div className="h-20 animate-pulse rounded-2xl bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        ) : vehiclePhotos.length > 0 ? (
          <>
            <div className="grid gap-6 md:grid-cols-2 2xl:grid-cols-3">
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
                    isFirstPhoto={photoPage === 1 && index === 0}
                    onPreview={setSelectedPhoto}
                  />
                </div>
              ))}
            </div>

            {photoTotalPages > 1 && (
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => handlePhotoPageChange(photoPage - 1)}
                  className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={photoPage === 1}
                >
                  Eelmine
                </button>

                {photoPageNumbers.map((pageNumber) => (
                  <button
                    key={pageNumber}
                    type="button"
                    onClick={() => handlePhotoPageChange(pageNumber)}
                    className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                      photoPage === pageNumber
                        ? "bg-blue-600 text-white shadow-md shadow-blue-600/25"
                        : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {pageNumber}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => handlePhotoPageChange(photoPage + 1)}
                  className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={photoPage === photoTotalPages}
                >
                  Järgmine
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="rounded-[28px] bg-white px-6 py-10 text-center shadow-[0_18px_50px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/70">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100 text-slate-400">
              <Camera size={30} />
            </div>

            <p className="mt-5 text-lg font-semibold text-slate-800">
              Fotosid ei leitud
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Selle sõidukiga ei ole hetkel seotud kinnitatud fotosid.
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

      <PhotoPreviewModal
        isOpen={!!selectedPhoto}
        photo={selectedPhoto}
        vehicle={vehicle}
        photos={vehiclePhotos}
        currentIndex={selectedPhotoIndex >= 0 ? selectedPhotoIndex : 0}
        onClose={() => setSelectedPhoto(null)}
        onPrevious={handlePreviousPhoto}
        onNext={handleNextPhoto}
      />
    </div>
  );
}

export default VehicleDetailPage;
