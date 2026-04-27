import api from "./axios";
import type { VehicleListResponse, VehicleQueryParams } from "../types/vehicle";

export async function getVehicles(params: VehicleQueryParams) {
  const response = await api.get<VehicleListResponse>("/vehicles", {
    params,
  });

  return response.data;
}