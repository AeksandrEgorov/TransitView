import api from "./axios";

import type {
  CategoryItem,
  CityItem,
  CompanyBranchItem,
  CompanyItem,
  CountyItem,
  ModelItem,
  MyFiltersResponse,
  PublicFiltersResponse,
} from "../types/reference";

export async function getPublicFilters(): Promise<PublicFiltersResponse> {
  const response = await api.get("/reference/public-filters");
  return response.data;
}

export async function getMyFilters(): Promise<MyFiltersResponse> {
  const response = await api.get("/reference/my-filters");
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

export async function getModels(categoryId?: number): Promise<ModelItem[]> {
  const response = await api.get("/reference/models", {
    params: categoryId ? { categoryId } : undefined,
  });

  return response.data;
}

export async function getCompanies(): Promise<CompanyItem[]> {
  const response = await api.get("/reference/companies");
  return response.data;
}

export async function getCompanyBranches(params?: {
  companyId?: number;
  cityId?: number;
}): Promise<CompanyBranchItem[]> {
  const response = await api.get("/reference/company-branches", {
    params,
  });

  return response.data;
}