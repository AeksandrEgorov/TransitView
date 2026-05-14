import type { ManageUserRole } from "../../config/manageApi";

export interface ManageUserFilterState {
  search: string;
  role: "" | ManageUserRole;
  createdFrom: string;
  createdTo: string;
}

interface ManageUsersFiltersProps {
  filters: ManageUserFilterState;
  roles: ManageUserRole[];
  onChange: <K extends keyof ManageUserFilterState>(
    key: K,
    value: ManageUserFilterState[K]
  ) => void;
}

function formatRole(role: ManageUserRole) {
  if (role === "Administraator") {
    return "Administraator";
  }

  if (role === "Andmebaasi_toimetaja") {
    return "Andmebaasi toimetaja";
  }

  return "Kasutaja";
}

function ManageUsersFilters({
  filters,
  roles,
  onChange,
}: ManageUsersFiltersProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <label className="block">
        <span className="text-sm font-bold text-slate-700">Otsing</span>

        <input
          type="text"
          value={filters.search}
          onChange={(event) => onChange("search", event.target.value)}
          className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          placeholder="Kasutajanimi või e-post"
        />
      </label>

      <label className="block">
        <span className="text-sm font-bold text-slate-700">Roll</span>

        <select
          value={filters.role}
          onChange={(event) =>
            onChange("role", event.target.value as ManageUserFilterState["role"])
          }
          className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
        >
          <option value="">Kõik rollid</option>

          {roles.map((role) => (
            <option key={role} value={role}>
              {formatRole(role)}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="text-sm font-bold text-slate-700">
          Lisatud alates
        </span>

        <input
          type="date"
          value={filters.createdFrom}
          onChange={(event) => onChange("createdFrom", event.target.value)}
          className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
        />
      </label>

      <label className="block">
        <span className="text-sm font-bold text-slate-700">Lisatud kuni</span>

        <input
          type="date"
          value={filters.createdTo}
          onChange={(event) => onChange("createdTo", event.target.value)}
          className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
        />
      </label>
    </div>
  );
}

export default ManageUsersFilters;