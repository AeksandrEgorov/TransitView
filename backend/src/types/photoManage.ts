// This file has photo manage types.

export interface ManagePhotoListQuery {
  page?: string | string[];
  limit?: string | string[];

  status?: string | string[];
  regNumber?: string | string[];

  cityId?: string | string[];
  countyId?: string | string[];
  vehicleId?: string | string[];

  authorId?: string | string[];
  vehicleCreatorId?: string | string[];

  categoryId?: string | string[];
  condition?: string | string[];

  createdFrom?: string | string[];
  createdTo?: string | string[];
}