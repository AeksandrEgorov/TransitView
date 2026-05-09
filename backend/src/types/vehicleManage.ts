export interface ManageVehicleListQuery {
  page?: string | string[];
  limit?: string | string[];

  status?: string | string[];
  regNumber?: string | string[];

  createdBy?: string | string[];

  cityId?: string | string[];
  countyId?: string | string[];
  categoryId?: string | string[];
  modelId?: string | string[];
  companyId?: string | string[];
  branchId?: string | string[];

  condition?: string | string[];

  createdFrom?: string | string[];
  createdTo?: string | string[];
}