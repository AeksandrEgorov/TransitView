import { useEffect, useMemo, useRef, useState } from "react";

import { getVehicles } from "../config/vehicleApi";
import { getCategories, getCities, getCounties } from "../config/referenceApi";
import { getPublicStats, type PublicStats } from "../config/statsApi";
import VehicleCard from "../components/home/VehicleCard";
import VehicleFilters from "../components/home/VehicleFilters";
import PageHero from "../components/ui/PageHero";
import PublicStatsSection from "../components/ui/PublicStatsSection";
import { useToast } from "../hooks/useToast";
import { useDebounce } from "../hooks/useDebounce";
import type { CategoryItem, CityItem, CountyItem } from "../types/reference";
import type {
  VehicleCondition,
  VehicleItem,
  VehicleListResponse,
} from "../types/vehicle";

function HomePage() {
  const { showToast } = useToast();

  const [vehicles, setVehicles] = useState<VehicleItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [counties, setCounties] = useState<CountyItem[]>([]);
  const [cities, setCities] = useState<CityItem[]>([]);

  const [publicStats, setPublicStats] = useState<PublicStats | null>(null);
  const [isStatsLoading, setIsStatsLoading] = useState(true);

  const [isLoading, setIsLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalVehicles, setTotalVehicles] = useState(0);

  const limit = 9;

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

  const paginationRef = useRef<HTMLDivElement | null>(null);
  const shouldKeepPaginationVisibleRef = useRef(false);

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
    async function loadVehicles() {
      try {
        setIsLoading(true);

        const data: VehicleListResponse = await getVehicles({
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

        setVehicles(data.items);
        setTotalPages(Math.max(data.meta.totalPages, 1));
        setTotalVehicles(data.meta.total);
      } catch (error) {
        console.error(error);

        showToast({
          variant: "error",
          title: "Sõidukite laadimine ebaõnnestus",
          message: "Proovi lehte uuesti värskendada.",
        });
      } finally {
        setIsLoading(false);
      }
    }

    loadVehicles();
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
    setPage(1);
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
  }, [isLoading, vehicles]);

  const pageNumbers = useMemo(() => {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }, [totalPages]);

  function resetFilters() {
    setSearch("");
    setSelectedCategoryId(null);
    setSelectedCountyId(null);
    setSelectedCityId(null);
    setSelectedCondition("");
    setCreatedFrom("");
    setCreatedTo("");
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
    setPage(newPage);
  }

  return (
    <div className="space-y-8">
      <PageHero
        eyebrow="TransitView"
        title="Transpordi andmebaas"
        description="Sirvi kinnitatud transpordikaarte, filtreeri tulemusi ja ava detailvaade koos fotodega."
      />

      <PublicStatsSection stats={publicStats} isLoading={isStatsLoading} />

      <VehicleFilters
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
              Saadaolevad sõidukid
            </h2>
          </div>

          <div className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-600 shadow-[0_12px_30px_rgba(15,23,42,0.06)] ring-1 ring-slate-200">
            Leitud kaarte:{" "}
            <span className="font-bold text-slate-900">{vehicles.length}</span>
            <span className="mx-2 text-slate-300">/</span>
            Kokku:{" "}
            <span className="font-bold text-slate-900">{totalVehicles}</span>
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
        ) : vehicles.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 2xl:grid-cols-3">
            {vehicles.map((vehicle, index) => (
              <div
                key={vehicle.vehicle_id}
                className="animate-card-in"
                style={{
                  animationDelay: `${index * 50}ms`,
                }}
              >
                <VehicleCard vehicle={vehicle} />
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-[28px] bg-white px-6 py-10 text-center shadow-[0_18px_50px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/70">
            <p className="text-lg font-semibold text-slate-800">
              Sobivaid sõidukeid ei leitud
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
    </div>
  );
}

export default HomePage;