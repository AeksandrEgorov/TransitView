import { Link, useParams } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, CalendarDays, Camera, MapPin, User } from "lucide-react";
import { getVehicleById } from "../config/vehicleApi";
import { getPhotosByVehicleId } from "../config/photoApi";
import PageHero from "../components/ui/PageHero";
import { useToast } from "../hooks/useToast";
import type { VehicleItem, VehiclePhoto } from "../types/vehicle";
import { formatVehicleCondition } from "../utils/formatters";
import { getCloudinaryImageUrl } from "../utils/cloudinary";
import StatusBadge from "../components/ui/StatusBadge";

function formatDate(dateString?: string | null) {
  if (!dateString) {
    return "Teadmata";
  }

  return new Date(dateString).toLocaleDateString("et-EE");
}

function getPhotoLocation(photo?: VehiclePhoto) {
  if (!photo?.city) {
    return "Asukoht teadmata";
  }

  return `${photo.city.name}, ${photo.city.county.name}`;
}

function getPhotoDate(photo?: VehiclePhoto) {
  if (!photo?.taken_at) {
    return "Kuupäev teadmata";
  }

  return formatDate(photo.taken_at);
}

function InfoCard({
  label,
  value,
  condition,
}: {
  label: string;
  value: string | number | null | undefined;
  condition?: VehicleItem["condition"];
}) {
  return (
    <div className="rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
        {label}
      </p>
      <div className="mt-1">
        {label === "Seisund" && condition ? (
          <StatusBadge condition={condition} />
        ) : (
          <p className="text-sm font-semibold text-slate-800">
            {value || "Teadmata"}
          </p>
        )}
      </div>
    </div>
  );
}

function VehicleDetailPage() {
  const { id } = useParams();
  const { showToast } = useToast();

  const [vehicle, setVehicle] = useState<VehicleItem | null>(null);
  const [vehiclePhotos, setVehiclePhotos] = useState<VehiclePhoto[]>([]);

  const [isVehicleLoading, setIsVehicleLoading] = useState(true);
  const [isPhotosLoading, setIsPhotosLoading] = useState(true);

  const [photoPage, setPhotoPage] = useState(1);
  const [photoTotalPages, setPhotoTotalPages] = useState(1);
  const [photoTotal, setPhotoTotal] = useState(0);

  const photosLimit = 12;
  const photosRef = useRef<HTMLDivElement | null>(null);

  const vehicleId = Number(id);

  useEffect(() => {
    async function loadVehicle() {
      if (Number.isNaN(vehicleId)) {
        setIsVehicleLoading(false);
        return;
      }

      try {
        setIsVehicleLoading(true);

        const data = await getVehicleById(vehicleId);
        setVehicle(data);
      } catch (error) {
        console.error(error);

        showToast({
          variant: "error",
          title: "Sõiduki laadimine ebaõnnestus",
          message: "Sõiduki andmeid ei õnnestunud laadida.",
        });
      } finally {
        setIsVehicleLoading(false);
      }
    }

    loadVehicle();
  }, [vehicleId, showToast]);

  useEffect(() => {
    async function loadPhotos() {
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
        setPhotoTotalPages(data.meta.totalPages);
        setPhotoTotal(data.meta.total);
      } catch (error) {
        console.error(error);

        showToast({
          variant: "error",
          title: "Fotode laadimine ebaõnnestus",
          message: "Sõiduki fotosid ei õnnestunud laadida.",
        });
      } finally {
        setIsPhotosLoading(false);
      }
    }

    loadPhotos();
  }, [vehicleId, photoPage, showToast]);

  const mainPhoto = vehiclePhotos[0] ?? vehicle?.photos[0];

  const mainImageUrl = mainPhoto?.file_path
    ? getCloudinaryImageUrl(mainPhoto.file_path, "w_1400,q_auto,f_auto")
    : "https://placehold.co/1400x850/e2e8f0/475569?text=TransitView";

  const photoPageNumbers = useMemo(() => {
    return Array.from({ length: photoTotalPages }, (_, index) => index + 1);
  }, [photoTotalPages]);

  function handlePhotoPageChange(newPage: number) {
    if (newPage === photoPage || newPage < 1 || newPage > photoTotalPages) {
      return;
    }

    setPhotoPage(newPage);

    window.setTimeout(() => {
      photosRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  }

  if (Number.isNaN(vehicleId)) {
    return (
      <div className="space-y-6">
        <PageHero
          eyebrow="Viga"
          title="Vigane sõiduki ID"
          description="Sõiduki identifikaator ei ole korrektne."
        />

        <Link
          to="/"
          className="inline-flex rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-600"
        >
          Tagasi avalehele
        </Link>
      </div>
    );
  }

  if (isVehicleLoading) {
    return (
      <div className="space-y-8">
        <div className="h-48 animate-pulse rounded-[34px] bg-slate-200" />

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="h-[520px] animate-pulse rounded-[30px] bg-slate-200" />
          <div className="h-[520px] animate-pulse rounded-[30px] bg-slate-200" />
        </div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="space-y-6">
        <PageHero
          eyebrow="Sõiduk"
          title="Sõidukit ei leitud"
          description="Otsitud sõidukit ei ole olemas või see ei ole avalikult nähtav."
        />

        <Link
          to="/"
          className="inline-flex rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-600"
        >
          Tagasi avalehele
        </Link>
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
        title={`${vehicle.model.manufacturer} ${vehicle.model.name}`}
        description={`Registrinumber ${vehicle.reg_number}. Siin on avalik ülevaade sõiduki andmetest ja sellega seotud kinnitatud fotodest.`}
      />

      <div>
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
        >
          <ArrowLeft className="h-4 w-4" />
          Tagasi avalehele
        </Link>
      </div>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="overflow-hidden rounded-[30px] bg-white shadow-[0_14px_40px_rgba(15,23,42,0.07)] ring-1 ring-slate-200/80">
          <div className="relative aspect-[16/10] bg-slate-200">
            <img
              src={mainImageUrl}
              alt={vehicle.reg_number}
              className="h-full w-full object-cover"
              loading="eager"
            />

            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-transparent px-6 pb-6 pt-16">
              <p className="text-2xl font-extrabold text-white">
                {vehicle.reg_number}
              </p>

              <p className="mt-1 text-sm text-slate-200">
                {vehicle.model.category.name}
              </p>
            </div>
          </div>

          <div className="grid gap-4 p-5 sm:grid-cols-3">
            <div className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
              <MapPin className="h-5 w-5 text-blue-600" />

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Foto asukoht
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-800">
                  {getPhotoLocation(mainPhoto)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
              <CalendarDays className="h-5 w-5 text-blue-600" />

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Pildistatud
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-800">
                  {getPhotoDate(mainPhoto)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
              <Camera className="h-5 w-5 text-blue-600" />

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Fotosid
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-800">
                  {photoTotal}
                </p>
              </div>
            </div>
          </div>
        </div>

        <aside className="rounded-[30px] bg-white p-6 shadow-[0_14px_40px_rgba(15,23,42,0.07)] ring-1 ring-slate-200/80">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-600">
            Andmed
          </p>

          <h2 className="mt-2 text-2xl font-bold text-slate-900">
            Sõiduki info
          </h2>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
            <InfoCard label="Registrinumber" value={vehicle.reg_number} />
            <InfoCard
              label="Seisund"
              value={formatVehicleCondition(vehicle.condition)}
              condition={vehicle.condition}
            />
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
          </div>

          {vehicle.creator && (
            <div className="mt-5 rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-blue-600" />

                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Lisas kasutaja
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {vehicle.creator.username}
                  </p>
                </div>
              </div>
            </div>
          )}
        </aside>
      </section>

      <section ref={photosRef} className="space-y-5">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
            Fotod
          </p>

          <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            Seotud pildid
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Siin kuvatakse selle sõidukiga seotud kinnitatud fotod.
          </p>
        </div>

        {isPhotosLoading ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div
                key={index}
                className="overflow-hidden rounded-3xl bg-white shadow-[0_14px_40px_rgba(15,23,42,0.07)] ring-1 ring-slate-200/80"
              >
                <div className="aspect-[4/3] animate-pulse bg-slate-200" />

                <div className="space-y-3 p-4">
                  <div className="h-4 animate-pulse rounded-xl bg-slate-200" />
                  <div className="h-4 animate-pulse rounded-xl bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        ) : vehiclePhotos.length > 0 ? (
          <>
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {vehiclePhotos.map((photo, index) => {
                const photoUrl = getCloudinaryImageUrl(
                  photo.file_path,
                  "w_700,h_500,c_fill,q_auto,f_auto"
                );

                return (
                  <article
                    key={photo.photo_id}
                    className="group overflow-hidden rounded-3xl bg-white shadow-[0_14px_40px_rgba(15,23,42,0.07)] ring-1 ring-slate-200/80 transition hover:-translate-y-0.5 hover:shadow-[0_18px_46px_rgba(15,23,42,0.1)]"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden bg-slate-200">
                      <img
                        src={photoUrl}
                        alt={`${vehicle.reg_number} foto ${index + 1}`}
                        loading="lazy"
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                      />

                      {photoPage === 1 && index === 0 && (
                        <span className="absolute left-3 top-3 rounded-full bg-slate-950/75 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                          Esimene foto
                        </span>
                      )}
                    </div>

                    <div className="space-y-3 p-4">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                          Asukoht
                        </p>

                        <p className="mt-1 text-sm font-semibold text-slate-800">
                          {getPhotoLocation(photo)}
                        </p>
                      </div>

                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                          Kuupäev
                        </p>

                        <p className="mt-1 text-sm font-semibold text-slate-800">
                          {getPhotoDate(photo)}
                        </p>
                      </div>

                      {photo.place && (
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                            Koht
                          </p>

                          <p className="mt-1 text-sm font-semibold text-slate-800">
                            {photo.place}
                          </p>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
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
          <div className="rounded-[28px] bg-white px-6 py-10 text-center shadow-[0_14px_40px_rgba(15,23,42,0.07)] ring-1 ring-slate-200/80">
            <p className="text-lg font-semibold text-slate-800">
              Fotosid ei leitud
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Selle sõidukiga ei ole hetkel seotud kinnitatud fotosid.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

export default VehicleDetailPage;