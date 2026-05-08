export interface UserListQuery {
  page?: string | string[];
  limit?: string | string[];

  role?: string | string[];
  search?: string | string[];

  createdFrom?: string | string[];
  createdTo?: string | string[];
}