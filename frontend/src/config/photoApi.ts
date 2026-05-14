import api from "./axios";
import type { VehicleCondition, VehiclePhoto } from "../types/vehicle";

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PhotosResponse<TPhoto = VehiclePhoto> {
  items: TPhoto[];
  meta: PaginationMeta;
}

export type VehiclePhotosResponse = PhotosResponse<VehiclePhoto>;

export interface PublicPhotoQueryParams {
  page?: number;
  limit?: number;
  cityId?: number;
  countyId?: number;
  vehicleId?: number;
  regNumber?: string;
  categoryId?: number;
  condition?: VehicleCondition | "";
  createdFrom?: string;
  createdTo?: string;
}

interface UploadPhotoResponse {
  message: string;
  file_path: string;
  public_id: string;
}

interface CreatePhotoRequest {
  vehicle_id: number;
  city_id?: number;
  new_city?: {
    name: string;
    county_id: number;
  };
  place?: string;
  taken_at?: string;
  file_path: string;
  cloudinary_public_id?: string;
}

interface CreatePhotoResponse {
  message: string;
  photo: VehiclePhoto;
}

export async function getPublicPhotos<TPhoto = VehiclePhoto>(
  params: PublicPhotoQueryParams = {}
): Promise<PhotosResponse<TPhoto>> {
  const response = await api.get<PhotosResponse<TPhoto>>("/photos", {
    params,
  });

  return response.data;
}

export async function getPhotosByVehicleId(
  vehicleId: number,
  params: {
    page: number;
    limit: number;
  }
): Promise<VehiclePhotosResponse> {
  const response = await api.get<VehiclePhotosResponse>(
    `/photos/vehicle/${vehicleId}`,
    {
      params,
    }
  );

  return response.data;
}

export async function uploadPhotoFile(
  file: File
): Promise<UploadPhotoResponse> {
  const formData = new FormData();
  formData.append("image", file);

  const response = await api.post<UploadPhotoResponse>(
    "/photos/upload",
    formData
  );

  return response.data;
}

export async function createPhoto(
  data: CreatePhotoRequest
): Promise<CreatePhotoResponse> {
  const response = await api.post<CreatePhotoResponse>("/photos", data);

  return response.data;
}