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