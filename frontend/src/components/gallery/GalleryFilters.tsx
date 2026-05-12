import { Search } from "lucide-react";

import PublicFiltersPanel from "../ui/PublicFiltersPanel";
import NativeDateInput from "../ui/NativeDateInput";

import type { CategoryItem, CityItem, CountyItem } from "../../types/reference";
import type { VehicleCondition } from "../../types/vehicle";

import { formatVehicleCondition } from "../../utils/formatters";
import { getTodayIsoDate } from "../../utils/date";

interface Props {
  search: string;
  selectedCategoryId: number | null;
  selectedCountyId: number | null;
  selectedCityId: number | null;
  selectedCondition: VehicleCondition | "";
  createdFrom: string;
  createdTo: string;
  categories: CategoryItem[];
  counties: CountyItem[];
  cities: CityItem[];
  conditions: VehicleCondition[];
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: number | null) => void;
  onCountyChange: (value: number | null) => void;
  onCityChange: (value: number | null) => void;
  onConditionChange: (value: VehicleCondition | "") => void;
  onCreatedFromChange: (value: string) => void;
  onCreatedToChange: (value: string) => void;
  onReset: () => void;
}

function GalleryFilters({
  search,
  selectedCategoryId,
  selectedCountyId,
  selectedCityId,
  selectedCondition,
  createdFrom,
  createdTo,
  categories,
  counties,
  cities,
  conditions,
  onSearchChange,
  onCategoryChange,
  onCountyChange,
  onCityChange,
  onConditionChange,
  onCreatedFromChange,
  onCreatedToChange,
  onReset,
}: Props) {
  const today = getTodayIsoDate();

  const activeFiltersCount = [
    search.trim(),
    selectedCategoryId,
    selectedCountyId,
    selectedCityId,
    selectedCondition,
    createdFrom,
    createdTo,
  ].filter(Boolean).length;

  function handleCreatedFromChange(value: string) {
    const safeValue = value > today ? today : value;

    onCreatedFromChange(safeValue);

    if (createdTo && safeValue && safeValue > createdTo) {
      onCreatedToChange(safeValue);
    }
  }

  function handleCreatedToChange(value: string) {
    const safeValue = value > today ? today : value;

    if (createdFrom && safeValue && safeValue < createdFrom) {
      onCreatedToChange(createdFrom);
      return;
    }

    onCreatedToChange(safeValue);
  }

  return (
    <PublicFiltersPanel
      title="Leia sobiv foto"
      description="Filtreeri fotosid sõiduki, kategooria, asukoha, seisundi ja lisamise kuupäeva järgi."
      activeFiltersCount={activeFiltersCount}
      onReset={onReset}
    >
      <div className="space-y-5">
        <div>
          <label className="mb-2 block text-sm font-bold text-slate-700">
            Otsi registrinumbri järgi
          </label>

          <div className="relative">
            <Search
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />

            <input
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Näiteks 3014 KUK"
              className="w-full rounded-2xl border border-slate-300 bg-white py-3 pl-11 pr-4 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>
        </div>

        {categories.length > 0 && (
          <div>
            <label className="mb-3 block text-sm font-bold text-slate-700">
              Vali transpordi liik
            </label>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onCategoryChange(null)}
                className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                  selectedCategoryId === null
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/25"
                    : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100"
                }`}
              >
                Kõik
              </button>

              {categories.map((category) => (
                <button
                  key={category.category_id}
                  type="button"
                  onClick={() => onCategoryChange(category.category_id)}
                  className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                    selectedCategoryId === category.category_id
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/25"
                      : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">
              Maakond
            </label>

            <select
              value={selectedCountyId ?? ""}
              onChange={(event) =>
                onCountyChange(
                  event.target.value ? Number(event.target.value) : null
                )
              }
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            >
              <option value="">Kõik maakonnad</option>

              {counties.map((county) => (
                <option key={county.county_id} value={county.county_id}>
                  {county.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">
              Linn
            </label>

            <select
              value={selectedCityId ?? ""}
              onChange={(event) =>
                onCityChange(
                  event.target.value ? Number(event.target.value) : null
                )
              }
              disabled={cities.length === 0}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
            >
              <option value="">Kõik linnad</option>

              {cities.map((city) => (
                <option key={city.city_id} value={city.city_id}>
                  {city.name}
                </option>
              ))}
            </select>
          </div>

          {conditions.length > 0 && (
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                Seisund
              </label>

              <select
                value={selectedCondition}
                onChange={(event) =>
                  onConditionChange(event.target.value as VehicleCondition | "")
                }
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              >
                <option value="">Kõik seisundid</option>

                {conditions.map((condition) => (
                  <option key={condition} value={condition}>
                    {formatVehicleCondition(condition)}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">
              Lisatud alates
            </label>

            <NativeDateInput
              value={createdFrom}
              max={createdTo || today}
              onChange={handleCreatedFromChange}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">
              Lisatud kuni
            </label>

            <NativeDateInput
              value={createdTo}
              min={createdFrom || undefined}
              max={today}
              onChange={handleCreatedToChange}
            />
          </div>
        </div>
      </div>
    </PublicFiltersPanel>
  );
}

export default GalleryFilters;