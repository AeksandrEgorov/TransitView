// This file has condition styles helpers.

import type { VehicleCondition } from "../types/vehicle";

export function getConditionStyles(condition: VehicleCondition) {
  switch (condition) {
    case "Töökorras":
      return "bg-emerald-50 text-emerald-700 ring-emerald-100";
    case "Ei_tööta":
      return "bg-amber-50 text-amber-700 ring-amber-100";
    case "Maha_kantud":
      return "bg-rose-50 text-rose-700 ring-rose-100";
    case "Müüdud":
      return "bg-violet-50 text-violet-700 ring-violet-100";
    default:
      return "bg-slate-100 text-slate-700 ring-slate-200";
  }
}
