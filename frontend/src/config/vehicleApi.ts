import api from "./axios";
import type { VehicleItem, VehicleListResponse, VehicleQueryParams } from "../types/vehicle";

export async function getVehicles(params: VehicleQueryParams) {
  const response = await api.get<VehicleListResponse>("/vehicles", {
    params,
  });

  return response.data;
}

export async function getVehicleById(vehicleId: number) {
  const response = await api.get<VehicleItem>(`/vehicles/${vehicleId}`);

  return response.data;
}