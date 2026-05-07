import api from "./axios";

export interface PublicStats {
  vehiclesTotal: number;
  photosTotal: number;
  categoriesTotal: number;
  citiesTotal: number;
}

export async function getPublicStats(): Promise<PublicStats> {
  const response = await api.get<PublicStats>("/stats/public");

  return response.data;
}