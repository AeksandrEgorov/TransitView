export type VehicleCondition =
  | "Töökorras"
  | "Ei_tööta"
  | "Maha_kantud"
  | "Müüdud"
  | "Teadmata";

export interface VehiclePhoto {
  photo_id: number;
  file_path: string;
  created_at: string;
  place?: string | null;
  city?: VehicleCity | null;
}

export interface VehicleCategory {
  category_id: number;
  name: string;
}

export interface VehicleModel {
  model_id: number;
  manufacturer: string;
  name: string;
  category: VehicleCategory;
}

export interface VehicleCompany {
  company_id: number;
  name: string;
}

export interface VehicleCounty {
  county_id: number;
  name: string;
}

export interface VehicleCity {
  city_id: number;
  name: string;
  county: VehicleCounty;
}

export interface VehicleBranch {
  branch_id: number;
  branch_name: string | null;
  company: VehicleCompany;
  city: VehicleCity;
}

export interface VehicleItem {
  vehicle_id: number;
  reg_number: string;
  vla_year: number | null;
  vin_code: string | null;
  chassis: string | null;
  condition: VehicleCondition;
  created_at: string;
  model: VehicleModel;
  branch: VehicleBranch | null;
  photos: VehiclePhoto[];
}

export interface VehicleListResponse {
  items: VehicleItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface VehicleQueryParams {
  page?: number;
  limit?: number;

  regNumber?: string;

  cityId?: number;
  countyId?: number;
  categoryId?: number;
  modelId?: number;
  companyId?: number;
  branchId?: number;

  condition?: VehicleCondition | "";

  createdFrom?: string;
  createdTo?: string;
}