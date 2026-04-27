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