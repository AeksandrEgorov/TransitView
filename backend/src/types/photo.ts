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
}

export interface UpdatePhotoBody {
  city_id?: number | null;
  place?: string | null;
  taken_at?: string | null;
  file_path?: string;
  cloudinary_public_id?: string | null;
}