// This file has gallery types.

import type {
  VehicleBranch,
  VehicleCondition,
  VehicleModel,
  VehiclePhoto,
} from "./vehicle";

export interface GalleryPhotoVehicle {
  vehicle_id: number;
  reg_number: string;
  vla_year: number | null;
  condition: VehicleCondition;
  created_at: string;
  model: VehicleModel;
  branch: VehicleBranch | null;
}

export interface GalleryPhoto extends VehiclePhoto {
  vehicle?: GalleryPhotoVehicle;
}