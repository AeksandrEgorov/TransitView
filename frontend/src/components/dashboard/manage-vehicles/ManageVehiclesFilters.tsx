// This file has the manage vehicles filters component.

import { Search } from "lucide-react";

import type { ManageUserOption } from "../../../config/manageApi";
import type { CategoryItem, CityItem, CountyItem } from "../../../types/reference";
import type { ReviewStatus, VehicleCondition } from "../../../types/vehicle";
import { formatVehicleCondition } from "../../../utils/formatters";

export interface ManageVehicleFilterState {
  status: ReviewStatus | "";
  regNumber: string;
  categoryId: number | null;
  countyId: number | null;
  cityId: number | null;
  condition: VehicleCondition | "";
  createdFrom: string;
  createdTo: string;
  creatorId: number | null;
}

interface Props {
  filters: ManageVehicleFilterState;
  categories: CategoryItem[];
  counties: CountyItem[];
  cities: CityItem[];
  statuses: ReviewStatus[];
  conditions: VehicleCondition[];
  users: ManageUserOption[];
  onChange: <K extends keyof ManageVehicleFilterState>(
    key: K,
    value: ManageVehicleFilterState[K]
  ) => void;
}

function formatStatus(status: ReviewStatus) {
  if (status === "Ootel") {
    return "Ootel";
  }

  if (status === "Kinnitatud") {
    return "Kinnitatud";
  }

  return "Tagasi lükatud";
}

function getUserLabel(user: ManageUserOption) {
  const username = user.username || "Nimetu kasutaja";
  const email = user.email ? ` · ${user.email}` : "";

  return `${username}${email}`;
}

function ManageVehiclesFilters({
  filters,
  categories,
  counties,
  cities,
  statuses,
  conditions,
  users,
  onChange,
}: Props) {
  const filteredCities = filters.countyId
    ? cities.filter((city) => city.county.county_id === filters.countyId)
    : cities;

  function handleCountyChange(value: string) {
    onChange("countyId", value ? Number(value) : null);
    onChange("cityId", null);
  }

  return (
    <div className="space-y-5">
      <div>
        <label className="mb-2 block text-sm font-bold text-slate-800">
          Registrinumber
        </label>

        <div className="relative">
          <Search
            size={18}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            type="search"
            value={filters.regNumber}
            onChange={(event) => onChange("regNumber", event.target.value)}
            placeholder="Näiteks 573"
            className="w-full rounded-2xl border border-slate-300 bg-white px-11 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />
        </div>
      </div>

      <div>
        <p className="mb-3 text-sm font-bold text-slate-800">
          Vali transpordi liik
        </p>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onChange("categoryId", null)}
            className={`rounded-2xl px-4 py-2 text-sm font-bold transition ${
              filters.categoryId === null
                ? "bg-blue-600 text-white shadow-[0_10px_22px_rgba(37,99,235,0.22)]"
                : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
            }`}
          >
            Kõik
          </button>

          {categories.map((category) => (
            <button
              type="button"
              key={category.category_id}
              onClick={() => onChange("categoryId", category.category_id)}
              className={`rounded-2xl px-4 py-2 text-sm font-bold transition ${
                filters.categoryId === category.category_id
                  ? "bg-blue-600 text-white shadow-[0_10px_22px_rgba(37,99,235,0.22)]"
                  : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <div>
          <label className="mb-2 block text-sm font-bold text-slate-800">
            Maakond
          </label>

          <select
            value={filters.countyId ?? ""}
            onChange={(event) => handleCountyChange(event.target.value)}
            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
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
          <label className="mb-2 block text-sm font-bold text-slate-800">
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
            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          >
            <option value="">Kõik linnad</option>

            {filteredCities.map((city) => (
              <option key={city.city_id} value={city.city_id}>
                {city.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-bold text-slate-800">
            Staatus
          </label>

          <select
            value={filters.status}
            onChange={(event) =>
              onChange(
                "status",
                event.target.value as ManageVehicleFilterState["status"]
              )
            }
            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          >
            <option value="">Kõik staatused</option>

            {statuses.map((status) => (
              <option key={status} value={status}>
                {formatStatus(status)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-bold text-slate-800">
            Seisukord
          </label>

          <select
            value={filters.condition}
            onChange={(event) =>
              onChange(
                "condition",
                event.target.value as ManageVehicleFilterState["condition"]
              )
            }
            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          >
            <option value="">Kõik seisukorrad</option>

            {conditions.map((condition) => (
              <option key={condition} value={condition}>
                {formatVehicleCondition(condition)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-bold text-slate-800">
            Lisatud alates
          </label>

          <input
            type="date"
            value={filters.createdFrom}
            onChange={(event) => onChange("createdFrom", event.target.value)}
            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-bold text-slate-800">
            Lisatud kuni
          </label>

          <input
            type="date"
            value={filters.createdTo}
            onChange={(event) => onChange("createdTo", event.target.value)}
            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div>
          <label className="mb-2 block text-sm font-bold text-slate-800">
            Kasutaja
          </label>

          <select
            value={filters.creatorId ?? ""}
            onChange={(event) =>
              onChange(
                "creatorId",
                event.target.value ? Number(event.target.value) : null
              )
            }
            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          >
            <option value="">Kõik kasutajad</option>

            {users.map((user) => (
              <option key={user.user_id} value={user.user_id}>
                {getUserLabel(user)}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

export default ManageVehiclesFilters;
