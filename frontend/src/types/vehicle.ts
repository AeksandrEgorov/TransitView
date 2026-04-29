export type VehicleCondition =
  | "Töökorras"
  | "Ei_tööta"
  | "Maha_kantud"
  | "Müüdud"
  | "Teadmata";

export type ReviewStatus = "Ootel" | "Kinnitatud" | "Tagasi_lukatud";

export interface VehicleCounty {
  county_id: number;
  name: string;
}

export interface VehicleCity {
  city_id: number;
  name: string;
  county: VehicleCounty;
}

export interface VehiclePhotoAuthor {
  user_id: number;
  username: string;
}

export interface VehiclePhoto {
  photo_id: number;
  vehicle_id?: number;
  author_id?: number;
  city_id?: number | null;
  place?: string | null;
  taken_at?: string | null;
  file_path: string;
  cloudinary_public_id?: string | null;
  status?: ReviewStatus;
  review_comment?: string | null;
  created_at: string;
  city?: VehicleCity | null;
  author?: VehiclePhotoAuthor;
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

export interface VehicleBranch {
  branch_id: number;
  branch_name: string | null;
  company: VehicleCompany;
  city: VehicleCity;
}

export interface VehicleUser {
  user_id: number;
  username: string;
  role: string;
}

export interface VehicleItem {
  vehicle_id: number;
  reg_number: string;
  vla_year: number | null;
  vin_code: string | null;
  chassis: string | null;
  condition: VehicleCondition;
  status?: ReviewStatus;
  review_comment?: string | null;
  created_at: string;
  reviewed_at?: string | null;

  model: VehicleModel;
  branch: VehicleBranch | null;
  photos: VehiclePhoto[];

  creator?: VehicleUser;
  reviewer?: VehicleUser | null;
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