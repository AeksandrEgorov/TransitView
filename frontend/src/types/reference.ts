// This file has reference types.

import type { VehicleCondition } from "./vehicle";

export interface CategoryItem {
  category_id: number;
  name: string;
}

export interface CountyItem {
  county_id: number;
  name: string;
}

export interface CityItem {
  city_id: number;
  name: string;
  county: CountyItem;
}

export interface ModelItem {
  model_id: number;
  manufacturer: string;
  name: string;
  category_id: number;
  category: CategoryItem;
}

export interface CompanyItem {
  company_id: number;
  name: string;
  city_id?: number | null;
  city?: CityItem | null;
}

export interface CompanyBranchItem {
  branch_id: number;
  company_id: number;
  city_id: number;
  branch_name: string | null;
  company: CompanyItem;
  city: CityItem;
}

export interface PublicFilterGroup {
  categories: CategoryItem[];
  counties: CountyItem[];
  cities: CityItem[];
  conditions: VehicleCondition[];
}

export interface PublicFiltersResponse {
  vehicleFilters: PublicFilterGroup;
  photoFilters: PublicFilterGroup;
}

export type MyFiltersResponse = PublicFiltersResponse;
export type ManageFiltersResponse = PublicFiltersResponse;
