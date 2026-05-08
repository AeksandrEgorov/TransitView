import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ImageIcon } from "lucide-react";

import PageHero from "../components/ui/PageHero";
import PublicStatsSection from "../components/ui/PublicStatsSection";
import GalleryFilters from "../components/gallery/GalleryFilters";
import GalleryPhotoCard from "../components/gallery/GalleryPhotoCard";
import PhotoPreviewModal from "../components/modals/PhotoPreviewModal";

import { getPublicPhotos } from "../config/photoApi";
import { getPublicFilters } from "../config/referenceApi";
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

  const visibleCities = useMemo(() => {
    if (!selectedCountyId) {
      return cities;
    }

    return cities.filter((city) => city.county.county_id === selectedCountyId);
  }, [cities, selectedCountyId]);

  const selectedPhotoIndex = selectedPhoto
    ? photos.findIndex((photo) => photo.photo_id === selectedPhoto.photo_id)
    : -1;

  const pageNumbers = useMemo(() => {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }, [totalPages]);

  const loadPhotos = useCallback(async () => {
    try {
      setIsLoading(true);

      const data = await getPublicPhotos({
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
          (photo: GalleryPhoto) => photo.photo_id === currentPhoto.photo_id
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
    async function loadPublicFilters() {
      try {
        const data = await getPublicFilters();

        setCategories(data.photoFilters.categories);
        setCounties(data.photoFilters.counties);
        setCities(data.photoFilters.cities);
      } catch (error) {
        console.error(error);

        showToast({
          variant: "error",
          title: "Andmete laadimine ebaõnnestus",
          message: "Avalike filtrite andmeid ei õnnestunud laadida.",
        });
      }
    }

    loadPublicFilters();
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

    const previousIndex = currentIndex <= 0 ? photos.length - 1 : currentIndex - 1;
    const previousPhoto = photos[previousIndex];

    if (previousPhoto) {
      setSelectedPhoto(previousPhoto);
    }
  }

  function handleNextPhoto() {
    if (!selectedPhoto || photos.length <= 1) {
      return;
    }

    const currentIndex = photos.findIndex(
      (photo) => photo.photo_id === selectedPhoto.photo_id
    );

    const nextIndex = currentIndex >= photos.length - 1 ? 0 : currentIndex + 1;
    const nextPhoto = photos[nextIndex];

    if (nextPhoto) {
      setSelectedPhoto(nextPhoto);
    }
  }

  return (
    <div className="space-y-10">
      <PageHero
        eyebrow="Galerii"
        title="Transpordifotod"
        description="Sirvi kinnitatud fotosid, leia sõiduk registrinumbri järgi ja vaata pildi detaile mugavas eelvaates."
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
        cities={visibleCities}
        onSearchChange={setSearch}
        onCategoryChange={setSelectedCategoryId}
        onCountyChange={handleCountyChange}
        onCityChange={setSelectedCityId}
        onConditionChange={setSelectedCondition}
        onCreatedFromChange={setCreatedFrom}
        onCreatedToChange={setCreatedTo}
        onReset={resetFilters}
      />

      <section>
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-600">
              Tulemused
            </p>

            <h2 className="mt-2 text-2xl font-bold text-slate-900">
              Saadaolevad fotod
            </h2>
          </div>

          <p className="text-sm font-semibold text-slate-500">
            Leitud fotosid:{" "}
            <span className="text-slate-900">{photos.length}</span> / Kokku:{" "}
            <span className="text-slate-900">{totalPhotos}</span>
          </p>
        </div>

        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-[390px] animate-pulse rounded-3xl bg-slate-200"
              />
            ))}
          </div>
        ) : photos.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {photos.map((photo) => (
              <GalleryPhotoCard
                key={photo.photo_id}
                photo={photo}
                onPreview={setSelectedPhoto}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl bg-white px-6 py-14 text-center shadow-[0_14px_40px_rgba(15,23,42,0.07)] ring-1 ring-slate-200">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <ImageIcon size={28} />
            </div>

            <h3 className="mt-5 text-xl font-bold text-slate-900">
              Sobivaid fotosid ei leitud
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Muuda filtreid või proovi otsingut laiendada.
            </p>
          </div>
        )}

        {totalPages > 1 && (
          <div
            ref={paginationRef}
            className="mt-8 flex flex-wrap items-center justify-center gap-2"
          >
            <button
              type="button"
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
              className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
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
              disabled={page === totalPages}
              className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Järgmine
            </button>
          </div>
        )}
      </section>

      <PhotoPreviewModal
        isOpen={Boolean(selectedPhoto)}
        photo={selectedPhoto}
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