import api from "./axios";
import type { CategoryItem, CityItem, CountyItem } from "../types/reference";

export async function getCategories() {
  const response = await api.get<CategoryItem[]>("/reference/categories");
  return response.data;
}

export async function getCounties() {
  const response = await api.get<CountyItem[]>("/reference/counties");
  return response.data;
}

export async function getCities(countyId?: number) {
  const response = await api.get<CityItem[]>("/reference/cities", {
    params: countyId ? { countyId } : undefined,
  });

  return response.data;
}