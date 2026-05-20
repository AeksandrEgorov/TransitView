// This file talks to the stats api.

import api from "./axios";

interface PublicStatsResponse {
  vehicles_total: number;
  photos_total: number;
  categories_total: number;
  cities_total: number;
}

export interface PublicStats {
  vehiclesTotal: number;
  photosTotal: number;
  categoriesTotal: number;
  citiesTotal: number;
}

export interface StatusStats {
  total: number;
  pending: number;
  confirmed: number;
  rejected: number;
}

export interface MyStats {
  vehicles: StatusStats;
  photos: StatusStats;
  total_items: number;
  pending_total: number;
  confirmed_total: number;
  rejected_total: number;
}

export interface ManageStats {
  vehicles: StatusStats;
  photos: StatusStats;

  users: {
    total: number;
    regular_users: number;
    editors: number;
    admins: number;
  };

  total_items: number;
  moderation_queue_total: number;
  pending_total: number;
  confirmed_total: number;
  rejected_total: number;
}

export async function getPublicStats(): Promise<PublicStats> {
  const response = await api.get<PublicStatsResponse>("/stats/public");

  return {
    vehiclesTotal: response.data.vehicles_total,
    photosTotal: response.data.photos_total,
    categoriesTotal: response.data.categories_total,
    citiesTotal: response.data.cities_total,
  };
}

export async function getMyStats(): Promise<MyStats> {
  const response = await api.get<MyStats>("/stats/my");
  return response.data;
}

export async function getManageStats(): Promise<ManageStats> {
  const response = await api.get<ManageStats>("/stats/manage");
  return response.data;
}