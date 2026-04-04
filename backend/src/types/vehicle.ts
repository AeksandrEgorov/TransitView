export interface VehicleListQuery {
  page?: string;
  limit?: string;
  regNumber?: string;
  cityId?: string;
  categoryId?: string;
  modelId?: string;
  companyId?: string;
  branchId?: string;
}

export interface UpdateVehicleBody {
  model_id?: number;
  branch_id?: number | null;
  reg_number?: string;
  vla_year?: number | null;
  vin_code?: string | null;
  chassis?: string | null;
}