import { Search } from "lucide-react";

import NativeDateInput from "../ui/NativeDateInput";

import type { CategoryItem, CityItem, CountyItem } from "../../types/reference";
import type { ReviewStatus, VehicleCondition } from "../../types/vehicle";

import { formatVehicleCondition } from "../../utils/formatters";
import { getTodayIsoDate } from "../../utils/date";

export type MyVehicleFilterState = {
  status: ReviewStatus | "";
  regNumber: string;
  categoryId: number | null;
  countyId: number | null;
  cityId: number | null;
  condition: VehicleCondition | "";
  createdFrom: string;
  createdTo: string;
};

interface Props {
  filters: MyVehicleFilterState;
  categories: CategoryItem[];
  counties: CountyItem[];
  cities: CityItem[];
  statuses: ReviewStatus[];
  conditions: VehicleCondition[];
  onChange: <K extends keyof MyVehicleFilterState>(
    key: K,
    value: MyVehicleFilterState[K]
  ) => void;
}

function formatStatus(status: ReviewStatus) {
  if (status === "Tagasi_lukatud") {
    return "Tagasi lükatud";
  }

  return status;
}

function MyVehiclesFilters({
  filters,
  categories,
  counties,
  cities,
  statuses,
  conditions,
  onChange,
}: Props) {
  const today = getTodayIsoDate();

  function handleCreatedFromChange(value: string) {
    const safeValue = value > today ? today : value;

    onChange("createdFrom", safeValue);

    if (filters.createdTo && safeValue && safeValue > filters.createdTo) {
      onChange("createdTo", safeValue);
    }
  }

  function handleCreatedToChange(value: string) {
    const safeValue = value > today ? today : value;

    if (filters.createdFrom && safeValue && safeValue < filters.createdFrom) {
      onChange("createdTo", filters.createdFrom);
      return;
    }

    onChange("createdTo", safeValue);
  }

  function handleCountyChange(countyId: number | null) {
    onChange("countyId", countyId);
    onChange("cityId", null);
  }

  return (
    <div className="space-y-5">
      <div>
        <label className="mb-2 block text-sm font-bold text-slate-700">
          Registrinumber
        </label>

        <div className="relative">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            size={18}
          />

          <input
            type="text"
            value={filters.regNumber}
            onChange={(event) => onChange("regNumber", event.target.value)}
            placeholder="Näiteks 573"
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
              onClick={() => onChange("categoryId", null)}
              className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                filters.categoryId === null
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
                onClick={() => onChange("categoryId", category.category_id)}
                className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                  filters.categoryId === category.category_id
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

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <div>
          <label className="mb-2 block text-sm font-bold text-slate-700">
            Maakond
          </label>

          <select
            value={filters.countyId ?? ""}
            onChange={(event) =>
              handleCountyChange(
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
            value={filters.cityId ?? ""}
            onChange={(event) =>
              onChange(
                "cityId",
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

        {statuses.length > 0 && (
          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">
              Staatus
            </label>

            <select
              value={filters.status}
              onChange={(event) =>
                onChange("status", event.target.value as ReviewStatus | "")
              }
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            >
              <option value="">Kõik staatused</option>

              {statuses.map((status) => (
                <option key={status} value={status}>
                  {formatStatus(status)}
                </option>
              ))}
            </select>
          </div>
        )}

        {conditions.length > 0 && (
          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">
              Seisukord
            </label>

            <select
              value={filters.condition}
              onChange={(event) =>
                onChange(
                  "condition",
                  event.target.value as VehicleCondition | ""
                )
              }
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            >
              <option value="">Kõik seisukorrad</option>

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
            value={filters.createdFrom}
            max={filters.createdTo || today}
            onChange={handleCreatedFromChange}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-bold text-slate-700">
            Lisatud kuni
          </label>

          <NativeDateInput
            value={filters.createdTo}
            min={filters.createdFrom || undefined}
            max={today}
            onChange={handleCreatedToChange}
          />
        </div>
      </div>
    </div>
  );
}

export default MyVehiclesFilters;