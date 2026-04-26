export interface PhotoListQuery {
  page?: string;
  limit?: string;
  cityId?: string;
  countyId?: string;
  vehicleId?: string;
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
}