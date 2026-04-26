export interface ManageVehicleListQuery {
  page?: string;
  limit?: string;
  status?: "Ootel" | "Kinnitatud" | "Tagasi_lukatud";
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