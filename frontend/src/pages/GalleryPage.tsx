import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ImageIcon } from "lucide-react";

import PageHero from "../components/ui/PageHero";
import PublicStatsSection from "../components/ui/PublicStatsSection";
import GalleryFilters from "../components/gallery/GalleryFilters";
import GalleryPhotoCard from "../components/gallery/GalleryPhotoCard";
import PhotoPreviewModal from "../components/modals/PhotoPreviewModal";
import { getPublicPhotos } from "../config/photoApi";
import { getCategories, getCities, getCounties } from "../config/referenceApi";
import { getPublicStats, type PublicStats } from "../config/statsApi";
import { useToast } from "../hooks/useToast";
import { useDebounce } from "../hooks/useDebounce";
import type { CategoryItem, CityItem, CountyItem } from "../types/reference";
import type { GalleryPhoto } from "../types/gallery";
import type { VehicleCondition } from "../types/vehicle";

function GalleryPage() {
  const { showToast } = useToast();

  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [counties, setCounties] = useState<CountyItem[]>([]);
  const [cities, setCities] = useState<CityItem[]>([]);

  const [publicStats, setPublicStats] = useState<PublicStats | null>(null);
  const [isStatsLoading, setIsStatsLoading] = useState(true);

  const [isLoading, setIsLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPhotos, setTotalPhotos] = useState(0);

  const limit = 12;

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);

  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    null
  );
  const [selectedCountyId, setSelectedCountyId] = useState<number | null>(null);
  const [selectedCityId, setSelectedCityId] = useState<number | null>(null);
  const [selectedCondition, setSelectedCondition] = useState<
    VehicleCondition | ""
  >("");

  const [createdFrom, setCreatedFrom] = useState("");
  const [createdTo, setCreatedTo] = useState("");

  const [selectedPhoto, setSelectedPhoto] = useState<GalleryPhoto | null>(null);

  const paginationRef = useRef<HTMLDivElement | null>(null);
  const shouldKeepPaginationVisibleRef = useRef(false);

  const selectedPhotoIndex = selectedPhoto
    ? photos.findIndex((photo) => photo.photo_id === selectedPhoto.photo_id)
    : -1;

  const pageNumbers = useMemo(() => {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }, [totalPages]);

  const loadPhotos = useCallback(async () => {
    try {
      setIsLoading(true);

      const data = await getPublicPhotos<GalleryPhoto>({
        page,
        limit,
        regNumber: debouncedSearch || undefined,
        categoryId: selectedCategoryId ?? undefined,
        countyId: selectedCountyId ?? undefined,
        cityId: selectedCityId ?? undefined,
        condition: selectedCondition || undefined,
        createdFrom: createdFrom || undefined,
        createdTo: createdTo || undefined,
      });

      setPhotos(data.items);
      setTotalPages(Math.max(data.meta.totalPages, 1));
      setTotalPhotos(data.meta.total);

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
      console.error(error);

      showToast({
        variant: "error",
        title: "Fotode laadimine ebaõnnestus",
        message: "Galerii fotosid ei õnnestunud laadida.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [
    page,
    limit,
    debouncedSearch,
    selectedCategoryId,
    selectedCountyId,
    selectedCityId,
    selectedCondition,
    createdFrom,
    createdTo,
    showToast,
  ]);

  useEffect(() => {
    async function loadReferenceData() {
      try {
        const [categoriesData, countiesData, citiesData] = await Promise.all([
          getCategories(),
          getCounties(),
          getCities(),
        ]);

        setCategories(categoriesData);
        setCounties(countiesData);
        setCities(citiesData);
      } catch (error) {
        console.error(error);

        showToast({
          variant: "error",
          title: "Andmete laadimine ebaõnnestus",
          message: "Viiteandmeid ei õnnestunud laadida.",
        });
      }
    }

    loadReferenceData();
  }, [showToast]);

  useEffect(() => {
    async function loadPublicStats() {
      try {
        setIsStatsLoading(true);

        const data = await getPublicStats();
        setPublicStats(data);
      } catch (error) {
        console.error(error);

        showToast({
          variant: "error",
          title: "Statistika laadimine ebaõnnestus",
          message: "Avalikku statistikat ei õnnestunud laadida.",
        });
      } finally {
        setIsStatsLoading(false);
      }
    }

    loadPublicStats();
  }, [showToast]);

  useEffect(() => {
    if (!selectedCountyId) {
      getCities()
        .then(setCities)
        .catch((error) => {
          console.error(error);

          showToast({
            variant: "error",
            title: "Linnade laadimine ebaõnnestus",
            message: "Linnade andmeid ei õnnestunud laadida.",
          });
        });

      return;
    }

    setSelectedCityId(null);

    getCities(selectedCountyId)
      .then(setCities)
      .catch((error) => {
        console.error(error);

        showToast({
          variant: "error",
          title: "Linnade laadimine ebaõnnestus",
          message: "Linnade andmeid ei õnnestunud laadida.",
        });
      });
  }, [selectedCountyId, showToast]);

  useEffect(() => {
    loadPhotos();
  }, [loadPhotos]);

  useEffect(() => {
    setPage(1);
    setSelectedPhoto(null);
  }, [
    debouncedSearch,
    selectedCategoryId,
    selectedCountyId,
    selectedCityId,
    selectedCondition,
    createdFrom,
    createdTo,
  ]);

  useEffect(() => {
    if (!isLoading && shouldKeepPaginationVisibleRef.current) {
      paginationRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });

      shouldKeepPaginationVisibleRef.current = false;
    }
  }, [isLoading, photos]);

  function resetFilters() {
    setSearch("");
    setSelectedCategoryId(null);
    setSelectedCountyId(null);
    setSelectedCityId(null);
    setSelectedCondition("");
    setCreatedFrom("");
    setCreatedTo("");
    setSelectedPhoto(null);
  }

  function handleCountyChange(countyId: number | null) {
    setSelectedCountyId(countyId);
    setSelectedCityId(null);
  }

  function handlePageChange(newPage: number) {
    if (newPage === page || newPage < 1 || newPage > totalPages) {
      return;
    }

    shouldKeepPaginationVisibleRef.current = true;
    setSelectedPhoto(null);
    setPage(newPage);
  }

  function handlePreviousPhoto() {
    if (!selectedPhoto || photos.length <= 1) {
      return;
    }

    const currentIndex = photos.findIndex(
      (photo) => photo.photo_id === selectedPhoto.photo_id
    );

    const previousIndex =
      currentIndex <= 0 ? photos.length - 1 : currentIndex - 1;

    setSelectedPhoto(photos[previousIndex]);
  }

  function handleNextPhoto() {
    if (!selectedPhoto || photos.length <= 1) {
      return;
    }

    const currentIndex = photos.findIndex(
      (photo) => photo.photo_id === selectedPhoto.photo_id
    );

    const nextIndex =
      currentIndex >= photos.length - 1 ? 0 : currentIndex + 1;

    setSelectedPhoto(photos[nextIndex]);
  }

  return (
    <div className="space-y-8">
      <PageHero
        eyebrow="Galerii"
        title="Fotogalerii"
        description="Sirvi kinnitatud fotosid, filtreeri tulemusi sõiduki, asukoha ja lisamise kuupäeva järgi ning vaata fotosid suuremalt modaalaknas."
      />

      <PublicStatsSection stats={publicStats} isLoading={isStatsLoading} />

      <GalleryFilters
        search={search}
        selectedCategoryId={selectedCategoryId}
        selectedCountyId={selectedCountyId}
        selectedCityId={selectedCityId}
        selectedCondition={selectedCondition}
        createdFrom={createdFrom}
        createdTo={createdTo}
        categories={categories}
        counties={counties}
        cities={cities}
        onSearchChange={setSearch}
        onCategoryChange={setSelectedCategoryId}
        onCountyChange={handleCountyChange}
        onCityChange={setSelectedCityId}
        onConditionChange={setSelectedCondition}
        onCreatedFromChange={setCreatedFrom}
        onCreatedToChange={setCreatedTo}
        onReset={resetFilters}
      />

      <section className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
              Tulemused
            </p>

            <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
              Saadaolevad fotod
            </h2>
          </div>

          <div className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-600 shadow-[0_12px_30px_rgba(15,23,42,0.06)] ring-1 ring-slate-200">
            Leitud fotosid:{" "}
            <span className="font-bold text-slate-900">{photos.length}</span>
            <span className="mx-2 text-slate-300">/</span>
            Kokku:{" "}
            <span className="font-bold text-slate-900">{totalPhotos}</span>
          </div>
        </div>

        {isLoading ? (
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
        ) : photos.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 2xl:grid-cols-3">
            {photos.map((photo, index) => (
              <div
                key={photo.photo_id}
                className="animate-card-in"
                style={{
                  animationDelay: `${index * 50}ms`,
                }}
              >
                <GalleryPhotoCard photo={photo} onPreview={setSelectedPhoto} />
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-[28px] bg-white px-6 py-10 text-center shadow-[0_18px_50px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/70">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100 text-slate-400">
              <ImageIcon size={30} />
            </div>

            <p className="mt-5 text-lg font-semibold text-slate-800">
              Sobivaid fotosid ei leitud
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Muuda filtreid või proovi otsingut laiendada.
            </p>
          </div>
        )}

        {totalPages > 1 && (
          <div
            ref={paginationRef}
            className="flex flex-wrap items-center justify-center gap-2 pt-2"
          >
            <button
              type="button"
              onClick={() => handlePageChange(page - 1)}
              className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={page === 1}
            >
              Eelmine
            </button>

            {pageNumbers.map((pageNumber) => (
              <button
                key={pageNumber}
                type="button"
                onClick={() => handlePageChange(pageNumber)}
                className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                  page === pageNumber
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/25"
                    : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                }`}
              >
                {pageNumber}
              </button>
            ))}

            <button
              type="button"
              onClick={() => handlePageChange(page + 1)}
              className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={page === totalPages}
            >
              Järgmine
            </button>
          </div>
        )}
      </section>

      <PhotoPreviewModal
        isOpen={!!selectedPhoto}
        photo={selectedPhoto}
        vehicle={selectedPhoto?.vehicle ?? null}
        photos={photos}
        currentIndex={selectedPhotoIndex >= 0 ? selectedPhotoIndex : 0}
        onClose={() => setSelectedPhoto(null)}
        onPrevious={handlePreviousPhoto}
        onNext={handleNextPhoto}
        showVehicleLink
      />
    </div>
  );
}

export default GalleryPage;