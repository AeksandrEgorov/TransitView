// This file has the manage users filters component.

import { Search } from "lucide-react";

import type { ManageUserRole } from "../../../config/manageApi";

export interface ManageUserFilterState {
  search: string;
  role: "" | ManageUserRole;
}
function ManageUsersFilters({
  filters,
  onChange,
}: {
  filters: ManageUserFilterState;
  onChange: <K extends keyof ManageUserFilterState>(
    key: K,
    value: ManageUserFilterState[K]
  ) => void;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(220px,0.6fr)]">
      <label className="block">
        <span className="text-sm font-bold text-slate-700">Otsing</span>

        <div className="mt-2 flex rounded-2xl border border-slate-300 bg-white focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100">
          <div className="flex items-center px-4 text-slate-400">
            <Search size={18} />
          </div>

          <input
            type="text"
            value={filters.search}
            onChange={(event) => onChange("search", event.target.value)}
            placeholder="Otsi nime või e-posti järgi..."
            className="min-w-0 flex-1 rounded-2xl px-0 py-3 pr-4 text-sm font-medium text-slate-800 outline-none"
          />
        </div>
      </label>

      <label className="block">
        <span className="text-sm font-bold text-slate-700">Roll</span>

        <select
          value={filters.role}
          onChange={(event) =>
            onChange("role", event.target.value as ManageUserFilterState["role"])
          }
          className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
        >
          <option value="">Kõik rollid</option>
          <option value="Kasutaja">Kasutaja</option>
          <option value="Andmebaasi_toimetaja">Andmebaasi toimetaja</option>
          <option value="Administraator">Administraator</option>
        </select>
      </label>
    </div>
  );
}


export default ManageUsersFilters;
