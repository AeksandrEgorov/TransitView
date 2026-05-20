// This file has photo types.

import type { VehicleCondition } from "../generated/prisma/client.js";

export interface PhotoListQuery {
  page?: string;
  limit?: string;
  cityId?: string;
  countyId?: string;
  vehicleId?: string;
  regNumber?: string;
  categoryId?: string;
  condition?: VehicleCondition | "";
  createdFrom?: string;
  createdTo?: string;
}

export interface MyPhotoListQuery {
  page?: string;
  limit?: string;
  status?: "Ootel" | "Tagasi_lukatud" | "Kinnitatud";
  regNumber?: string;
  cityId?: string;
  countyId?: string;
  categoryId?: string;
  condition?: VehicleCondition | "";
  createdFrom?: string;
  createdTo?: string;
}

export interface NewCityBody {
  name: string;
  county_id: number;
}

export interface CreatePhotoBody {
  vehicle_id: number;
  city_id?: number | null;
  new_city?: NewCityBody | null;
  new_city_name?: string;
  new_city_county_id?: number;
  place?: string | null;
  taken_at?: string | null;
  file_path: string;
  cloudinary_public_id?: string | null;
}

export interface UpdatePhotoBody {
  city_id?: number | null;
  new_city?: NewCityBody | null;
  new_city_name?: string;
  new_city_county_id?: number;
  place?: string | null;
  taken_at?: string | null;
  file_path?: string;
  cloudinary_public_id?: string | null;
}