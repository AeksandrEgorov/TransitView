// This file has vehicle types.

export interface VehicleListQuery {
  page?: string;
  limit?: string;
  regNumber?: string;
  cityId?: string;
  countyId?: string;
  categoryId?: string;
  modelId?: string;
  companyId?: string;
  branchId?: string;
  condition?: string;
  createdFrom?: string;
  createdTo?: string;
}

export interface MyVehicleListQuery {
  page?: string;
  limit?: string;
  status?: "Ootel" | "Tagasi_lukatud" | "Kinnitatud";
}

export interface UpdateVehicleBody {
  model_id?: number;
  branch_id?: number | null;
  reg_number?: string;
  vla_year?: number | null;
  vin_code?: string | null;
  chassis?: string | null;
  condition?:
    | "Töökorras"
    | "Ei_tööta"
    | "Maha_kantud"
    | "Müüdud"
    | "Teadmata";
}