export interface ManagePhotoListQuery {
  page?: string;
  limit?: string;
  status?: "Ootel" | "Kinnitatud" | "Tagasi_lukatud";
  cityId?: string;
  countyId?: string;
  vehicleId?: string;
  authorId?: string;
  createdFrom?: string;
  createdTo?: string;
}