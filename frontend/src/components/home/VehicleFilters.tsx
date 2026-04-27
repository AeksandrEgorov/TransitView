import type { CategoryItem, CityItem, CountyItem } from "../../types/reference";
import type { VehicleCondition } from "../../types/vehicle";
import { formatVehicleCondition } from "../../utils/formatters";

const conditions: VehicleCondition[] = [
  "Töökorras",
  "Ei_tööta",
  "Maha_kantud",
  "Müüdud",
  "Teadmata",
];

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

  onSearchChange: (value: string) => void;
  onCategoryChange: (value: number | null) => void;
  onCountyChange: (value: number | null) => void;
  onCityChange: (value: number | null) => void;
  onConditionChange: (value: VehicleCondition | "") => void;
  onCreatedFromChange: (value: string) => void;
  onCreatedToChange: (value: string) => void;
  onReset: () => void;
}

function VehicleFilters({
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
  onSearchChange,
  onCategoryChange,
  onCountyChange,
  onCityChange,
  onConditionChange,
  onCreatedFromChange,
  onCreatedToChange,
  onReset,
}: Props) {
  return (
    <section className="overflow-hidden rounded-[30px] bg-white shadow-[0_14px_40px_rgba(15,23,42,0.07)] ring-1 ring-slate-200/80">
      <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-600">
              Filtrid
            </p>

            <h2 className="mt-2 text-2xl font-bold text-slate-900">
              Leia sobiv transport
            </h2>

            <p className="mt-2 max-w-2xl text-sm text-slate-500">
              Filtreeri transpordivahendeid kategooria, asukoha, seisundi,
              numbri ja lisamise kuupäeva järgi.
            </p>
          </div>

          <div className="hidden rounded-2xl bg-slate-100 px-4 py-3 text-sm font-medium text-slate-600 lg:block">
            Avalikud kinnitatud kirjed
          </div>
        </div>
      </div>

      <div className="space-y-6 p-5 sm:p-6">
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Otsi registrinumbri järgi
          </label>

          <input
            type="text"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Näiteks 3014 KUK"
            className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
          />
        </div>

        <div>
          <p className="mb-3 text-sm font-semibold text-slate-700">
            Vali transpordi liik
          </p>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onCategoryChange(null)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                selectedCategoryId === null
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/25"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              Kõik
            </button>

            {categories.map((category) => (
              <button
                key={category.category_id}
                type="button"
                onClick={() => onCategoryChange(category.category_id)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  selectedCategoryId === category.category_id
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/25"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Maakond
            </label>

            <select
              value={selectedCountyId ?? ""}
              onChange={(event) =>
                onCountyChange(
                  event.target.value ? Number(event.target.value) : null
                )
              }
              className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
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
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Linn
            </label>

            <select
              value={selectedCityId ?? ""}
              onChange={(event) =>
                onCityChange(
                  event.target.value ? Number(event.target.value) : null
                )
              }
              className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
            >
              <option value="">Kõik linnad</option>

              {cities.map((city) => (
                <option key={city.city_id} value={city.city_id}>
                  {city.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Seisund
            </label>

            <select
              value={selectedCondition}
              onChange={(event) =>
                onConditionChange(event.target.value as VehicleCondition | "")
              }
              className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
            >
              <option value="">Kõik seisundid</option>

              {conditions.map((condition) => (
                <option key={condition} value={condition}>
                  {formatVehicleCondition(condition)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Lisatud alates
            </label>

            <input
              type="date"
              value={createdFrom}
              onChange={(event) => onCreatedFromChange(event.target.value)}
              className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Lisatud kuni
            </label>

            <input
              type="date"
              value={createdTo}
              onChange={(event) => onCreatedToChange(event.target.value)}
              className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-200 pt-5">
          <button
            type="button"
            onClick={onReset}
            className="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Lähtesta filtrid
          </button>

          <div className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-600">
            Filtrid rakenduvad automaatselt
          </div>
        </div>
      </div>
    </section>
  );
}

export default VehicleFilters;