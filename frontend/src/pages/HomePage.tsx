import { useEffect, useMemo, useRef, useState } from "react";

import { getVehicles } from "../config/vehicleApi";
import { getPublicFilters } from "../config/referenceApi";
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

  const visibleCities = useMemo(() => {
    if (!selectedCountyId) {
      return cities;
    }

    return cities.filter((city) => city.county.county_id === selectedCountyId);
  }, [cities, selectedCountyId]);

  const pageNumbers = useMemo(() => {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }, [totalPages]);

  useEffect(() => {
    async function loadPublicFilters() {
      try {
        const data = await getPublicFilters();

        setCategories(data.vehicleFilters.categories);
        setCounties(data.vehicleFilters.counties);
        setCities(data.vehicleFilters.cities);
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
    <div className="space-y-10">
      <PageHero
        eyebrow="TransitView"
        title="Transpordi andmebaas"
        description="Sirvi kinnitatud sõidukikaarte, fotosid ja ühistranspordi infot ühes kohas."
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
              Saadaolevad sõidukid
            </h2>
          </div>

          <p className="text-sm font-semibold text-slate-500">
            Leitud kaarte:{" "}
            <span className="text-slate-900">{vehicles.length}</span> / Kokku:{" "}
            <span className="text-slate-900">{totalVehicles}</span>
          </p>
        </div>

        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-[420px] animate-pulse rounded-3xl bg-slate-200"
              />
            ))}
          </div>
        ) : vehicles.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {vehicles.map((vehicle) => (
              <VehicleCard key={vehicle.vehicle_id} vehicle={vehicle} />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl bg-white px-6 py-14 text-center shadow-[0_14px_40px_rgba(15,23,42,0.07)] ring-1 ring-slate-200">
            <h3 className="text-xl font-bold text-slate-900">
              Sobivaid sõidukeid ei leitud
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
    </div>
  );
}

export default HomePage;