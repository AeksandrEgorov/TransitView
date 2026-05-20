// This file groups API calls for the user's own dashboard.
// It handles personal vehicle/photo lists and create, update, delete requests.

import api from "./axios";

import type {
  DashboardListParams,
  DashboardPhoto,
  DashboardPhotosResponse,
  DashboardVehicle,
  DashboardVehiclesResponse,
} from "../types/dashboard";
import type { VehicleCondition } from "../types/vehicle";

interface NewCityPayload {
  name: string;
  county_id: number;
}

interface NewModelPayload {
  manufacturer: string;
  name: string;
  category_id: number;
}

interface NewCompanyPayload {
  name: string;
  city_id?: number;
  new_city?: NewCityPayload;
}

interface NewBranchPayload {
  branch_name?: string | null;
  company_id?: number;
  new_company?: NewCompanyPayload;
  city_id?: number;
  new_city?: NewCityPayload;
}

export interface CreateMyVehicleRequest {
  model_id?: number;
  new_model?: NewModelPayload;

  branch_id?: number | null;
  new_branch?: NewBranchPayload;

  reg_number: string;
  vla_year?: number | null;
  vin_code?: string | null;
  chassis?: string | null;
  condition?: VehicleCondition;

  city_id?: number;
  new_city?: NewCityPayload;
  place?: string;
  taken_at?: string | null;

  image: File;
}

export interface UpdateMyVehicleRequest {
  model_id?: number;
  new_model?: NewModelPayload;

  branch_id?: number | null;
  new_branch?: NewBranchPayload;

  reg_number?: string;
  vla_year?: number | null;
  vin_code?: string | null;
  chassis?: string | null;
  condition?: VehicleCondition;
}

export interface CreateMyVehicleResponse {
  message: string;
  vehicle: DashboardVehicle;
  photo: DashboardPhoto;
}

export interface UpdateMyVehicleResponse {
  message: string;
  vehicle: DashboardVehicle;
}

export interface UpdateMyPhotoRequest {
  city_id?: number | null;
  new_city?: NewCityPayload;
  place?: string | null;
  taken_at?: string | null;
  image?: File | null;
}

export interface UpdateMyPhotoResponse {
  message: string;
  photo: DashboardPhoto;
}

function appendJson(formData: FormData, key: string, value: unknown) {
  formData.append(key, JSON.stringify(value));
}

function appendNewModelToFormData(formData: FormData, model: NewModelPayload) {
  appendJson(formData, "new_model", model);
  formData.append("new_model_manufacturer", model.manufacturer);
  formData.append("new_model_name", model.name);
  formData.append("new_model_category_id", String(model.category_id));
}

function appendNewBranchToFormData(
  formData: FormData,
  branch: NewBranchPayload
) {
  appendJson(formData, "new_branch", branch);

  if (branch.branch_name) {
    formData.append("new_branch_name", branch.branch_name);
  }

  if (branch.company_id) {
    formData.append("new_branch_company_id", String(branch.company_id));
  }

  if (branch.city_id) {
    formData.append("new_branch_city_id", String(branch.city_id));
  }

  if (branch.new_city) {
    appendJson(formData, "new_branch_city", branch.new_city);
    formData.append("new_branch_city_name", branch.new_city.name);
    formData.append(
      "new_branch_city_county_id",
      String(branch.new_city.county_id)
    );
  }

  if (branch.new_company) {
    appendJson(formData, "new_company", branch.new_company);
    formData.append("new_company_name", branch.new_company.name);

    if (branch.new_company.city_id) {
      formData.append(
        "new_company_city_id",
        String(branch.new_company.city_id)
      );
    }

    if (branch.new_company.new_city) {
      appendJson(formData, "new_company_city", branch.new_company.new_city);
      formData.append(
        "new_company_city_name",
        branch.new_company.new_city.name
      );
      formData.append(
        "new_company_city_county_id",
        String(branch.new_company.new_city.county_id)
      );
    }
  }
}

function buildUpdateVehicleBody(data: UpdateMyVehicleRequest) {
  return {
    ...(data.model_id ? { model_id: data.model_id } : {}),

    ...(data.new_model
      ? {
          new_model_manufacturer: data.new_model.manufacturer,
          new_model_name: data.new_model.name,
          new_model_category_id: data.new_model.category_id,
        }
      : {}),

    ...(data.branch_id !== undefined ? { branch_id: data.branch_id } : {}),

    ...(data.new_branch?.branch_name
      ? { new_branch_name: data.new_branch.branch_name }
      : {}),

    ...(data.new_branch?.company_id
      ? { new_branch_company_id: data.new_branch.company_id }
      : {}),

    ...(data.new_branch?.new_company
      ? { new_company_name: data.new_branch.new_company.name }
      : {}),

    ...(data.new_branch?.new_company?.city_id
      ? { new_company_city_id: data.new_branch.new_company.city_id }
      : {}),

    ...(data.new_branch?.new_company?.new_city
      ? {
          new_company_city_name: data.new_branch.new_company.new_city.name,
          new_company_city_county_id:
            data.new_branch.new_company.new_city.county_id,
        }
      : {}),

    ...(data.new_branch?.city_id
      ? { new_branch_city_id: data.new_branch.city_id }
      : {}),

    ...(data.new_branch?.new_city
      ? {
          new_branch_city_name: data.new_branch.new_city.name,
          new_branch_city_county_id: data.new_branch.new_city.county_id,
        }
      : {}),

    ...(data.reg_number !== undefined ? { reg_number: data.reg_number } : {}),
    ...(data.vla_year !== undefined ? { vla_year: data.vla_year } : {}),
    ...(data.vin_code !== undefined ? { vin_code: data.vin_code } : {}),
    ...(data.chassis !== undefined ? { chassis: data.chassis } : {}),
    ...(data.condition !== undefined ? { condition: data.condition } : {}),
  };
}

function buildUpdatePhotoBody(data: UpdateMyPhotoRequest) {
  return {
    ...(data.new_city
      ? {
          new_city_name: data.new_city.name,
          new_city_county_id: data.new_city.county_id,
        }
      : data.city_id !== undefined
        ? { city_id: data.city_id }
        : {}),

    ...(data.place !== undefined ? { place: data.place } : {}),
    ...(data.taken_at !== undefined ? { taken_at: data.taken_at } : {}),
  };
}

export async function getMyVehicles(
  params: DashboardListParams = {}
): Promise<DashboardVehiclesResponse> {
  const response = await api.get<DashboardVehiclesResponse>("/vehicles/my", {
    params,
  });

  return response.data;
}

export async function getMyVehicleById(
  vehicleId: number
): Promise<DashboardVehicle> {
  const response = await api.get<DashboardVehicle>(`/vehicles/my/${vehicleId}`);

  return response.data;
}

export async function createMyVehicle(
  data: CreateMyVehicleRequest
): Promise<CreateMyVehicleResponse> {
  const formData = new FormData();

  formData.append("image", data.image);
  formData.append("reg_number", data.reg_number);

  if (data.model_id) {
    formData.append("model_id", String(data.model_id));
  }

  if (data.new_model) {
    appendNewModelToFormData(formData, data.new_model);
  }

  if (data.branch_id) {
    formData.append("branch_id", String(data.branch_id));
  }

  if (data.new_branch) {
    appendNewBranchToFormData(formData, data.new_branch);
  }

  if (data.vla_year !== undefined && data.vla_year !== null) {
    formData.append("vla_year", String(data.vla_year));
  }

  if (data.vin_code) {
    formData.append("vin_code", data.vin_code);
  }

  if (data.chassis) {
    formData.append("chassis", data.chassis);
  }

  if (data.condition) {
    formData.append("condition", data.condition);
  }

  if (data.city_id) {
    formData.append("city_id", String(data.city_id));
  }

  if (data.new_city) {
    appendJson(formData, "new_city", data.new_city);
    formData.append("new_city_name", data.new_city.name);
    formData.append("new_city_county_id", String(data.new_city.county_id));
  }

  if (data.place) {
    formData.append("place", data.place);
  }

  if (data.taken_at) {
    formData.append("taken_at", data.taken_at);
  }

  const response = await api.post<CreateMyVehicleResponse>(
    "/vehicles",
    formData
  );

  return response.data;
}

export async function updateMyVehicle(
  vehicleId: number,
  data: UpdateMyVehicleRequest
): Promise<UpdateMyVehicleResponse> {
  const response = await api.patch<UpdateMyVehicleResponse>(
    `/vehicles/${vehicleId}`,
    buildUpdateVehicleBody(data)
  );

  return response.data;
}

export async function deleteMyVehicle(vehicleId: number) {
  const response = await api.delete(`/vehicles/${vehicleId}`);
  return response.data;
}

export async function getMyPhotos(
  params: DashboardListParams = {}
): Promise<DashboardPhotosResponse> {
  const response = await api.get<DashboardPhotosResponse>("/photos/my", {
    params,
  });

  return response.data;
}

export async function updateMyPhoto(
  photoId: number,
  data: UpdateMyPhotoRequest
): Promise<UpdateMyPhotoResponse> {
  if (!data.image) {
    const response = await api.patch<UpdateMyPhotoResponse>(
      `/photos/${photoId}`,
      buildUpdatePhotoBody(data)
    );

    return response.data;
  }

  const formData = new FormData();

  formData.append("image", data.image);

  if (data.new_city) {
    formData.append("new_city_name", data.new_city.name);
    formData.append("new_city_county_id", String(data.new_city.county_id));
  } else if (data.city_id !== undefined) {
    formData.append(
      "city_id",
      data.city_id === null ? "" : String(data.city_id)
    );
  }

  if (data.place !== undefined) {
    formData.append("place", data.place ?? "");
  }

  if (data.taken_at !== undefined) {
    formData.append("taken_at", data.taken_at ?? "");
  }

  const response = await api.patch<UpdateMyPhotoResponse>(
    `/photos/${photoId}`,
    formData
  );

  return response.data;
}

export async function deleteMyPhoto(photoId: number) {
  const response = await api.delete(`/photos/${photoId}`);
  return response.data;
}
