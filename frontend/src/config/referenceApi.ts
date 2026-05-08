import api from "./axios";
import type {
  CategoryItem,
  CityItem,
  CountyItem,
  PublicFiltersResponse,
} from "../types/reference";

export async function getPublicFilters(): Promise<PublicFiltersResponse> {
  const response = await api.get("/reference/public-filters");
  return response.data;
}

export async function getCategories(): Promise<CategoryItem[]> {
  const response = await api.get("/reference/categories");
  return response.data;
}

export async function getCounties(): Promise<CountyItem[]> {
  const response = await api.get("/reference/counties");
  return response.data;
}

export async function getCities(countyId?: number): Promise<CityItem[]> {
  const response = await api.get("/reference/cities", {
    params: countyId ? { countyId } : undefined,
  });

  return response.data;
}