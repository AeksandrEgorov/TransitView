import api from "./axios";

import type {
  DashboardPhoto,
  DashboardPhotosResponse,
  DashboardVehicle,
  DashboardVehiclesResponse,
} from "../types/dashboard";
import type { ReviewStatus, VehicleCondition } from "../types/vehicle";

interface NewCityPayload {
  name: string;
  county_id: number;
}

interface NewModelPayload {
  manufacturer: string;
  name: string;
  category_id: number;
}

interface NewCompanyPayload {
  name: string;
  city_id?: number;
  new_city?: NewCityPayload;
}

interface NewBranchPayload {
  branch_name?: string | null;
  company_id?: number;
  new_company?: NewCompanyPayload;
  city_id?: number;
  new_city?: NewCityPayload;
}

export type ManageUserRole =
  | "Kasutaja"
  | "Andmebaasi_toimetaja"
  | "Administraator";

export interface ManageListParams {
  page?: number;
  limit?: number;

  status?: ReviewStatus | string;
  regNumber?: string;

  creatorId?: number;
  createdBy?: number;
  userId?: number;

  cityId?: number;
  countyId?: number;
  categoryId?: number;
  modelId?: number;
  companyId?: number;
  branchId?: number;

  condition?: VehicleCondition | string;

  createdFrom?: string;
  createdTo?: string;
}

export interface ManageUsersParams {
  page?: number;
  limit?: number;
  role?: ManageUserRole;
  search?: string;
  createdFrom?: string;
  createdTo?: string;
}

export interface UpdateManageVehicleRequest {
  model_id?: number;
  new_model?: NewModelPayload;

  branch_id?: number | null;
  new_branch?: NewBranchPayload;

  reg_number?: string;
  vla_year?: number | null;
  vin_code?: string | null;
  chassis?: string | null;
  condition?: VehicleCondition;
}

export interface UpdateManagePhotoRequest {
  city_id?: number | null;
  new_city?: NewCityPayload;
  place?: string | null;
  taken_at?: string | null;
  image?: File | null;
}

export interface ManageUserOption {
  user_id: number;
  username: string;
  email: string;
  role: ManageUserRole;
  created_at: string;

  vehicles_total?: number;
  vehicles_pending?: number;
  vehicles_confirmed?: number;
  vehicles_rejected?: number;

  photos_total?: number;
  photos_pending?: number;
  photos_confirmed?: number;
  photos_rejected?: number;

  vehicles_count?: number;
  photos_count?: number;
  pending_vehicles_count?: number;
  confirmed_vehicles_count?: number;
  rejected_vehicles_count?: number;
  pending_photos_count?: number;
  confirmed_photos_count?: number;
  rejected_photos_count?: number;
}

export interface CreateManageUserRequest {
  username: string;
  email: string;
  password: string;
  role: ManageUserRole;
}

export interface UpdateManageUserRequest {
  username?: string;
  email?: string;
  password?: string;
  role?: ManageUserRole;
}

export type ManageVehicle = DashboardVehicle;
export type ManagePhoto = DashboardPhoto;

export interface ManageUsersResponse {
  items: ManageUserOption[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export type ManageVehiclesResponse = DashboardVehiclesResponse;
export type ManagePhotosResponse = DashboardPhotosResponse;

export interface UpdateManageVehicleResponse {
  message: string;
  vehicle: ManageVehicle;
}

export interface UpdateManagePhotoResponse {
  message: string;
  photo: ManagePhoto;
}

export interface ManageUserResponse {
  message?: string;
  user: ManageUserOption;
}

function buildUpdateVehicleBody(data: UpdateManageVehicleRequest) {
  return {
    ...(data.model_id ? { model_id: data.model_id } : {}),

    ...(data.new_model
      ? {
          new_model_manufacturer: data.new_model.manufacturer,
          new_model_name: data.new_model.name,
          new_model_category_id: data.new_model.category_id,
        }
      : {}),

    ...(data.branch_id !== undefined ? { branch_id: data.branch_id } : {}),

    ...(data.new_branch?.branch_name
      ? { new_branch_name: data.new_branch.branch_name }
      : {}),

    ...(data.new_branch?.company_id
      ? { new_branch_company_id: data.new_branch.company_id }
      : {}),

    ...(data.new_branch?.new_company
      ? { new_company_name: data.new_branch.new_company.name }
      : {}),

    ...(data.new_branch?.new_company?.city_id
      ? { new_company_city_id: data.new_branch.new_company.city_id }
      : {}),

    ...(data.new_branch?.new_company?.new_city
      ? {
          new_company_city_name: data.new_branch.new_company.new_city.name,
          new_company_city_county_id:
            data.new_branch.new_company.new_city.county_id,
        }
      : {}),

    ...(data.new_branch?.city_id
      ? { new_branch_city_id: data.new_branch.city_id }
      : {}),

    ...(data.new_branch?.new_city
      ? {
          new_branch_city_name: data.new_branch.new_city.name,
          new_branch_city_county_id: data.new_branch.new_city.county_id,
        }
      : {}),

    ...(data.reg_number !== undefined ? { reg_number: data.reg_number } : {}),
    ...(data.vla_year !== undefined ? { vla_year: data.vla_year } : {}),
    ...(data.vin_code !== undefined ? { vin_code: data.vin_code } : {}),
    ...(data.chassis !== undefined ? { chassis: data.chassis } : {}),
    ...(data.condition !== undefined ? { condition: data.condition } : {}),
  };
}

function buildUpdatePhotoBody(data: UpdateManagePhotoRequest) {
  return {
    ...(data.new_city
      ? {
          new_city_name: data.new_city.name,
          new_city_county_id: data.new_city.county_id,
        }
      : data.city_id !== undefined
        ? { city_id: data.city_id }
        : {}),

    ...(data.place !== undefined ? { place: data.place } : {}),
    ...(data.taken_at !== undefined ? { taken_at: data.taken_at } : {}),
  };
}

export async function getManageVehicles(
  params: ManageListParams = {}
): Promise<ManageVehiclesResponse> {
  const response = await api.get<ManageVehiclesResponse>("/manage/vehicles", {
    params,
  });

  return response.data;
}

export async function getManageVehicleById(
  vehicleId: number
): Promise<ManageVehicle> {
  const response = await api.get<ManageVehicle>(
    `/manage/vehicles/${vehicleId}`
  );

  return response.data;
}

export async function updateManageVehicle(
  vehicleId: number,
  data: UpdateManageVehicleRequest
): Promise<UpdateManageVehicleResponse> {
  const response = await api.patch<UpdateManageVehicleResponse>(
    `/manage/vehicles/${vehicleId}`,
    buildUpdateVehicleBody(data)
  );

  return response.data;
}

export async function deleteManageVehicle(vehicleId: number) {
  const response = await api.delete(`/manage/vehicles/${vehicleId}`);

  return response.data;
}

export async function approveManageVehicle(vehicleId: number) {
  const response = await api.patch(`/manage/vehicles/${vehicleId}/approve`);

  return response.data;
}

export async function rejectManageVehicle(
  vehicleId: number,
  data: { review_comment: string }
) {
  const response = await api.patch(`/manage/vehicles/${vehicleId}/reject`, data);

  return response.data;
}

export async function pendingManageVehicle(vehicleId: number) {
  const response = await api.patch(`/manage/vehicles/${vehicleId}/pending`);

  return response.data;
}

export async function getManagePhotos(
  params: ManageListParams = {}
): Promise<ManagePhotosResponse> {
  const response = await api.get<ManagePhotosResponse>("/manage/photos", {
    params,
  });

  return response.data;
}

export async function getManagePhotoById(
  photoId: number
): Promise<ManagePhoto> {
  const response = await api.get<ManagePhoto>(`/manage/photos/${photoId}`);

  return response.data;
}

export async function updateManagePhoto(
  photoId: number,
  data: UpdateManagePhotoRequest
): Promise<UpdateManagePhotoResponse> {
  if (!data.image) {
    const response = await api.patch<UpdateManagePhotoResponse>(
      `/manage/photos/${photoId}`,
      buildUpdatePhotoBody(data)
    );

    return response.data;
  }

  const formData = new FormData();

  formData.append("image", data.image);

  if (data.new_city) {
    formData.append("new_city_name", data.new_city.name);
    formData.append("new_city_county_id", String(data.new_city.county_id));
  } else if (data.city_id !== undefined) {
    formData.append(
      "city_id",
      data.city_id === null ? "" : String(data.city_id)
    );
  }

  if (data.place !== undefined) {
    formData.append("place", data.place ?? "");
  }

  if (data.taken_at !== undefined) {
    formData.append("taken_at", data.taken_at ?? "");
  }

  const response = await api.patch<UpdateManagePhotoResponse>(
    `/manage/photos/${photoId}`,
    formData
  );

  return response.data;
}

export async function deleteManagePhoto(photoId: number) {
  const response = await api.delete(`/manage/photos/${photoId}`);

  return response.data;
}

export async function approveManagePhoto(photoId: number) {
  const response = await api.patch(`/manage/photos/${photoId}/approve`);

  return response.data;
}

export async function rejectManagePhoto(
  photoId: number,
  data: { review_comment: string }
) {
  const response = await api.patch(`/manage/photos/${photoId}/reject`, data);

  return response.data;
}

export async function pendingManagePhoto(photoId: number) {
  const response = await api.patch(`/manage/photos/${photoId}/pending`);

  return response.data;
}

export async function getManageUsers(
  params: ManageUsersParams = {}
): Promise<ManageUsersResponse> {
  const response = await api.get<ManageUsersResponse>("/manage/users", {
    params,
  });

  return response.data;
}

export async function getManageUserById(
  userId: number
): Promise<ManageUserOption> {
  const response = await api.get<ManageUserOption>(`/manage/users/${userId}`);

  return response.data;
}

export async function createManageUser(
  data: CreateManageUserRequest
): Promise<ManageUserResponse> {
  const response = await api.post<ManageUserResponse>("/manage/users", data);

  return response.data;
}

export async function updateManageUser(
  userId: number,
  data: UpdateManageUserRequest
): Promise<ManageUserResponse> {
  const response = await api.patch<ManageUserResponse>(
    `/manage/users/${userId}`,
    data
  );

  return response.data;
}

export async function deleteManageUser(userId: number) {
  const response = await api.delete(`/manage/users/${userId}`);

  return response.data;
}