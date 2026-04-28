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