// This file has formatters helpers.

import type { VehicleCondition } from "../types/vehicle";

export function formatVehicleCondition(condition: VehicleCondition) {
  const labels: Record<VehicleCondition, string> = {
    Töökorras: "Töökorras",
    Ei_tööta: "Ei tööta",
    Maha_kantud: "Maha kantud",
    Müüdud: "Müüdud",
    Teadmata: "Teadmata",
  };

  return labels[condition];
}