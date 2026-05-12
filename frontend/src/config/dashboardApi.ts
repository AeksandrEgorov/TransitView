import api from "./axios";

import type {
  DashboardListParams,
  DashboardPhoto,
  DashboardPhotosResponse,
  DashboardVehicle,
  DashboardVehiclesResponse,
} from "../types/dashboard";

export async function getMyVehicles(params: DashboardListParams = {}) {
  const response = await api.get<DashboardVehiclesResponse>("/vehicles/my", {
    params,
  });

  return response.data;
}

export async function getMyVehicleById(vehicleId: number) {
  const response = await api.get<DashboardVehicle>(
    `/vehicles/my/${vehicleId}`
  );

  return response.data;
}

export async function deleteMyVehicle(vehicleId: number) {
  const response = await api.delete<DashboardVehicle>(
    `/vehicles/${vehicleId}`
  );

  return response.data;
}

export async function getMyPhotos(params: DashboardListParams = {}) {
  const response = await api.get<DashboardPhotosResponse>("/photos/my", {
    params,
  });

  return response.data;
}

export async function deleteMyPhoto(photoId: number) {
  const response = await api.delete<DashboardPhoto>(`/photos/${photoId}`);

  return response.data;
}