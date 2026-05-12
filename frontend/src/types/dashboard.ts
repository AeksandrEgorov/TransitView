import type { ReviewStatus, VehicleCondition } from "./vehicle";

export interface DashboardMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface DashboardCounty {
  county_id: number;
  name: string;
}

export interface DashboardCity {
  city_id: number;
  name: string;
  county: DashboardCounty;
}

export interface DashboardCategory {
  category_id: number;
  name: string;
}

export interface DashboardModel {
  model_id?: number;
  manufacturer: string;
  name: string;
  category: DashboardCategory;
}

export interface DashboardUser {
  user_id: number;
  username: string | null;
  role?: string;
}

export interface DashboardCompany {
  company_id?: number;
  name: string | null;
}

export interface DashboardBranch {
  branch_id: number;
  branch_name: string | null;
  company?: DashboardCompany | null;
  city?: DashboardCity | null;
}

export interface DashboardVehiclePhoto {
  photo_id: number;
  vehicle_id: number;
  author_id?: number;
  city_id?: number | null;
  place?: string | null;
  taken_at?: string | null;
  file_path: string | null;
  cloudinary_public_id?: string | null;
  status?: ReviewStatus;
  review_comment?: string | null;
  reviewed_at?: string | null;
  created_at?: string;
  author?: DashboardUser | null;
  city?: DashboardCity | null;
}

export interface DashboardVehicle {
  vehicle_id: number;
  model_id: number;
  branch_id: number | null;
  reg_number: string;
  vla_year: number | null;
  vin_code: string | null;
  chassis: string | null;
  condition: VehicleCondition;
  status: ReviewStatus;
  review_comment: string | null;
  created_by: number;
  reviewed_by: number | null;
  reviewed_at: string | null;
  created_at: string;

  model: DashboardModel;
  branch: DashboardBranch | null;

  creator?: DashboardUser | null;
  reviewer?: DashboardUser | null;

  photos: DashboardVehiclePhoto[];
  photos_count?: number;
}

export interface DashboardVehiclesResponse {
  items: DashboardVehicle[];
  meta: DashboardMeta;
}

export interface DashboardPhoto {
  photo_id: number;
  vehicle_id: number;
  author_id: number;
  city_id: number | null;
  place: string | null;
  taken_at: string | null;
  file_path: string;
  cloudinary_public_id: string | null;
  status: ReviewStatus;
  review_comment: string | null;
  reviewed_at: string | null;
  created_at: string;

  author?: DashboardUser | null;
  city?: DashboardCity | null;

  vehicle: {
    vehicle_id: number;
    reg_number: string;
    status: ReviewStatus;
    condition: VehicleCondition;
    model: DashboardModel;
  };
}

export interface DashboardPhotosResponse {
  items: DashboardPhoto[];
  meta: DashboardMeta;
}

export interface DashboardListParams {
  page?: number;
  limit?: number;
  status?: ReviewStatus | "";
  regNumber?: string;
  categoryId?: number;
  countyId?: number;
  cityId?: number;
  condition?: VehicleCondition | "";
  createdFrom?: string;
  createdTo?: string;
}