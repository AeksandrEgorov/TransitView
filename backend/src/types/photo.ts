export interface PhotoListQuery {
  page?: string;
  limit?: string;
  cityId?: string;
  vehicleId?: string;
}

export interface CreatePhotoBody {
  vehicle_id: number;
  city_id: number;
  place?: string | null;
  taken_at?: string | null;
  file_path: string;
}

export interface UpdatePhotoBody {
  city_id?: number;
  place?: string | null;
  taken_at?: string | null;
}