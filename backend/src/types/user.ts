// This file has user types.

import type { UserRole } from "../generated/prisma/client.js";

export interface UserListQuery {
  page?: string | string[];
  limit?: string | string[];
  role?: string | string[];
  search?: string | string[];
  createdFrom?: string | string[];
  createdTo?: string | string[];
}

export interface GetUsersParams {
  page: number;
  limit: number;
  role?: UserRole;
  search?: string;
  createdFrom?: Date;
  createdTo?: Date;
}

export interface CreateUserBody {
  username: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface UpdateUserBody {
  username?: string;
  email?: string;
  password?: string;
  role?: UserRole;
}