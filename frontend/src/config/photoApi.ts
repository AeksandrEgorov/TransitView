import api from "./axios";
import type { VehiclePhoto } from "../types/vehicle";

export interface VehiclePhotosResponse {
  items: VehiclePhoto[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface UploadPhotoResponse {
  message: string;
  file_path: string;
  public_id: string;
}

interface CreatePhotoRequest {
  vehicle_id: number;
  city_id?: number;
  place?: string;
  taken_at?: string;
  file_path: string;
  cloudinary_public_id?: string;
}

interface CreatePhotoResponse {
  message: string;
  photo: VehiclePhoto;
}

export async function getPhotosByVehicleId(
  vehicleId: number,
  params: {
    page: number;
    limit: number;
  }
) {
  const response = await api.get<VehiclePhotosResponse>(
    `/photos/vehicle/${vehicleId}`,
    {
      params,
    }
  );

  return response.data;
}

export async function uploadPhotoFile(file: File, token: string) {
  const formData = new FormData();
  formData.append("image", file);

  const response = await api.post<UploadPhotoResponse>(
    "/photos/upload",
    formData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
}

export async function createPhoto(data: CreatePhotoRequest, token: string) {
  const response = await api.post<CreatePhotoResponse>("/photos", data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
}