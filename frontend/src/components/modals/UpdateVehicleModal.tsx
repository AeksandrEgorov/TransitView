import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";

import Modal from "../ui/Modal";
import RequiredLabel from "../ui/RequiredLabel";
import NativeDateInput from "../ui/NativeDateInput";

import { updateMyPhoto, updateMyVehicle } from "../../config/dashboardApi";
import {
  getCategories,
  getCities,
  getCompanies,
  getCompanyBranches,
  getCounties,
  getModels,
} from "../../config/referenceApi";

import { useToast } from "../../hooks/useToast";
import { getCloudinaryImageUrl } from "../../utils/cloudinary";

import type {
  DashboardVehicle,
  DashboardVehiclePhoto,
} from "../../types/dashboard";
import type {
  CategoryItem,
  CityItem,
  CompanyBranchItem,
  CompanyItem,
  CountyItem,
  ModelItem,
} from "../../types/reference";
import type { VehicleCondition } from "../../types/vehicle";

type UpdateVehiclePayload = Parameters<typeof updateMyVehicle>[1];
type UpdatePhotoPayload = Parameters<typeof updateMyPhoto>[1];

type UpdateVehicleRequest = (
  vehicleId: number,
  data: UpdateVehiclePayload
) => Promise<unknown>;

type UpdatePhotoRequest = (
  photoId: number,
  data: UpdatePhotoPayload
) => Promise<unknown>;

interface Props {
  isOpen: boolean;
  vehicle: DashboardVehicle | null;
  onClose: () => void;
  onSuccess: () => void;

  onUpdateVehicle?: UpdateVehicleRequest;
  onUpdateFirstPhoto?: UpdatePhotoRequest;
}

const allowedImageTypes = ["image/jpeg", "image/png"];
const allowedImageExtensions = [".jpg", ".jpeg", ".png"];

const vehicleConditions: VehicleCondition[] = [
  "Töökorras",
  "Ei_tööta",
  "Maha_kantud",
  "Müüdud",
  "Teadmata",
];

function getTodayIsoDate() {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
}

function toDateInputValue(value?: string | Date | null) {
  if (!value) {
    return getTodayIsoDate();
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return getTodayIsoDate();
  }

  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
}

function isAllowedImageFile(file: File) {
  const fileName = file.name.toLowerCase();

  const hasAllowedType = allowedImageTypes.includes(file.type);
  const hasAllowedExtension = allowedImageExtensions.some((extension) =>
    fileName.endsWith(extension)
  );

  return hasAllowedType && hasAllowedExtension;
}

function formatCondition(condition: VehicleCondition) {
  if (condition === "Ei_tööta") {
    return "Ei tööta";
  }

  if (condition === "Maha_kantud") {
    return "Maha kantud";
  }

  return condition;
}

function getVehicleCategoryId(vehicle: DashboardVehicle | null) {
  return vehicle?.model?.category?.category_id
    ? String(vehicle.model.category.category_id)
    : "";
}

function getVehicleModelId(vehicle: DashboardVehicle | null) {
  const vehicleWithModelId = vehicle as
    | (DashboardVehicle & { model_id?: number | null })
    | null;

  const modelWithId = vehicle?.model as { model_id?: number | null } | null;

  return vehicleWithModelId?.model_id ?? modelWithId?.model_id ?? null;
}

function getVehicleBranchId(vehicle: DashboardVehicle | null) {
  const vehicleWithBranchId = vehicle as
    | (DashboardVehicle & { branch_id?: number | null })
    | null;

  const branchWithId = vehicle?.branch as { branch_id?: number | null } | null;

  return vehicleWithBranchId?.branch_id ?? branchWithId?.branch_id ?? null;
}

function getPhotoCityId(photo?: DashboardVehiclePhoto | null) {
  const photoWithCityId = photo as
    | (DashboardVehiclePhoto & { city_id?: number | null })
    | null
    | undefined;

  return photoWithCityId?.city_id ?? photo?.city?.city_id ?? null;
}

function mergeById<T>(
  items: T[],
  item: T | null | undefined,
  getId: (value: T) => number | null | undefined
) {
  if (!item) {
    return items;
  }

  const itemId = getId(item);

  if (!itemId) {
    return items;
  }

  const alreadyExists = items.some((current) => getId(current) === itemId);

  if (alreadyExists) {
    return items;
  }

  return [item, ...items];
}

function getCategoryId(category?: CategoryItem | null) {
  return category?.category_id ?? null;
}

function getCountyId(county?: CountyItem | null) {
  return county?.county_id ?? null;
}

function getCityId(city?: CityItem | null) {
  return city?.city_id ?? null;
}

function getCompanyId(company?: CompanyItem | null) {
  return company?.company_id ?? null;
}

function getBranchId(branch?: CompanyBranchItem | null) {
  return branch?.branch_id ?? null;
}

function getModelId(model?: ModelItem | null) {
  return model?.model_id ?? null;
}

function UpdateVehicleModal({
  isOpen,
  vehicle,
  onClose,
  onSuccess,
  onUpdateVehicle,
  onUpdateFirstPhoto,
}: Props) {
  const { showToast } = useToast();

  const updateVehicleRequest = onUpdateVehicle ?? updateMyVehicle;
  const updatePhotoRequest = onUpdateFirstPhoto ?? updateMyPhoto;

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const today = getTodayIsoDate();

  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [counties, setCounties] = useState<CountyItem[]>([]);
  const [models, setModels] = useState<ModelItem[]>([]);
  const [companies, setCompanies] = useState<CompanyItem[]>([]);
  const [branches, setBranches] = useState<CompanyBranchItem[]>([]);
  const [cities, setCities] = useState<CityItem[]>([]);

  const [isReferencesLoading, setIsReferencesLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [useNewModel, setUseNewModel] = useState(false);
  const [categoryId, setCategoryId] = useState("");
  const [modelId, setModelId] = useState("");
  const [newModelManufacturer, setNewModelManufacturer] = useState("");
  const [newModelName, setNewModelName] = useState("");
  const [newModelCategoryId, setNewModelCategoryId] = useState("");

  const [companyFilterId, setCompanyFilterId] = useState("");
  const [branchId, setBranchId] = useState("");

  const [useNewBranch, setUseNewBranch] = useState(false);
  const [newBranchName, setNewBranchName] = useState("");

  const [useNewBranchCompany, setUseNewBranchCompany] = useState(false);
  const [newBranchCompanyId, setNewBranchCompanyId] = useState("");
  const [newCompanyName, setNewCompanyName] = useState("");

  const [useNewCompanyCity, setUseNewCompanyCity] = useState(false);
  const [newCompanyCityId, setNewCompanyCityId] = useState("");
  const [newCompanyCityName, setNewCompanyCityName] = useState("");
  const [newCompanyCityCountyId, setNewCompanyCityCountyId] = useState("");

  const [useNewBranchCity, setUseNewBranchCity] = useState(false);
  const [newBranchCityId, setNewBranchCityId] = useState("");
  const [newBranchCityName, setNewBranchCityName] = useState("");
  const [newBranchCityCountyId, setNewBranchCityCountyId] = useState("");

  const [regNumber, setRegNumber] = useState("");
  const [vlaYear, setVlaYear] = useState("");
  const [vinCode, setVinCode] = useState("");
  const [chassis, setChassis] = useState("");
  const [condition, setCondition] = useState<VehicleCondition>("Teadmata");

  const [selectedFirstPhotoFile, setSelectedFirstPhotoFile] =
    useState<File | null>(null);

  const [photoCityId, setPhotoCityId] = useState("");
  const [useNewPhotoCity, setUseNewPhotoCity] = useState(false);
  const [newPhotoCityName, setNewPhotoCityName] = useState("");
  const [newPhotoCityCountyId, setNewPhotoCityCountyId] = useState("");
  const [photoPlace, setPhotoPlace] = useState("");
  const [photoTakenAt, setPhotoTakenAt] = useState(getTodayIsoDate());

  const currentModelId = getVehicleModelId(vehicle);
  const currentBranchId = getVehicleBranchId(vehicle);

  const firstPhoto = vehicle?.photos?.[0] ?? null;
  const firstPhotoCityId = getPhotoCityId(firstPhoto);
  const firstPhotoInitialDate = toDateInputValue(firstPhoto?.taken_at);

  const firstPhotoCanModify =
    Boolean(firstPhoto) && firstPhoto?.status !== "Kinnitatud";

  const isPhotoPlaceRequired = !useNewPhotoCity && photoCityId === "";

  const firstPhotoUrl = firstPhoto?.file_path
    ? getCloudinaryImageUrl(
        firstPhoto.file_path,
        "w_700,h_450,c_fill,q_auto,f_auto"
      )
    : "https://placehold.co/800x500/e2e8f0/475569?text=TransitView";

  const currentCategory = useMemo(() => {
    if (!vehicle?.model?.category) {
      return null;
    }

    return {
      ...vehicle.model.category,
      category_id: vehicle.model.category.category_id,
    } as CategoryItem;
  }, [vehicle?.model?.category]);

  const currentModel = useMemo(() => {
    if (!vehicle?.model || !currentModelId) {
      return null;
    }

    return {
      ...vehicle.model,
      model_id: currentModelId,
      category_id: vehicle.model.category.category_id,
      category: vehicle.model.category,
    } as ModelItem;
  }, [vehicle?.model, currentModelId]);

  const currentCompany = useMemo(() => {
    if (!vehicle?.branch?.company) {
      return null;
    }

    return {
      ...vehicle.branch.company,
      company_id: vehicle.branch.company.company_id,
    } as CompanyItem;
  }, [vehicle?.branch?.company]);

  const currentBranchCity = useMemo(() => {
    if (!vehicle?.branch?.city?.county) {
      return null;
    }

    return {
      ...vehicle.branch.city,
      city_id: vehicle.branch.city.city_id,
      county_id: vehicle.branch.city.county.county_id,
      county: vehicle.branch.city.county,
    } as CityItem;
  }, [vehicle?.branch?.city]);

  const currentPhotoCity = useMemo(() => {
    if (!firstPhoto?.city?.county) {
      return null;
    }

    return {
      ...firstPhoto.city,
      city_id: firstPhoto.city.city_id,
      county_id: firstPhoto.city.county.county_id,
      county: firstPhoto.city.county,
    } as CityItem;
  }, [firstPhoto?.city]);

  const currentBranch = useMemo(() => {
    if (
      !vehicle?.branch ||
      !currentBranchId ||
      !vehicle.branch.company ||
      !vehicle.branch.city
    ) {
      return null;
    }

    return {
      ...vehicle.branch,
      branch_id: currentBranchId,
      company_id: vehicle.branch.company.company_id,
      city_id: vehicle.branch.city.city_id,
      company: vehicle.branch.company,
      city: vehicle.branch.city,
    } as CompanyBranchItem;
  }, [vehicle?.branch, currentBranchId]);

  const categoriesForSelect = useMemo(() => {
    return mergeById(categories, currentCategory, getCategoryId);
  }, [categories, currentCategory]);

  const modelsForSelect = useMemo(() => {
    return mergeById(models, currentModel, getModelId);
  }, [models, currentModel]);

  const companiesForSelect = useMemo(() => {
    return mergeById(companies, currentCompany, getCompanyId);
  }, [companies, currentCompany]);

  const citiesForSelect = useMemo(() => {
    let nextCities = cities;

    nextCities = mergeById(nextCities, currentBranchCity, getCityId);
    nextCities = mergeById(nextCities, currentPhotoCity, getCityId);

    return nextCities;
  }, [cities, currentBranchCity, currentPhotoCity]);

  const countiesForSelect = useMemo(() => {
    let nextCounties = counties;

    nextCounties = mergeById(
      nextCounties,
      currentBranchCity?.county as CountyItem | undefined,
      getCountyId
    );

    nextCounties = mergeById(
      nextCounties,
      currentPhotoCity?.county as CountyItem | undefined,
      getCountyId
    );

    return nextCounties;
  }, [counties, currentBranchCity, currentPhotoCity]);

  const branchesForSelect = useMemo(() => {
    return mergeById(branches, currentBranch, getBranchId);
  }, [branches, currentBranch]);

  const filteredModels = useMemo(() => {
    if (!categoryId) {
      return modelsForSelect;
    }

    return modelsForSelect.filter(
      (model) => model.category_id === Number(categoryId)
    );
  }, [modelsForSelect, categoryId]);

  const filteredBranches = useMemo(() => {
    if (!companyFilterId) {
      return branchesForSelect;
    }

    return branchesForSelect.filter(
      (branch) => branch.company_id === Number(companyFilterId)
    );
  }, [branchesForSelect, companyFilterId]);

  useEffect(() => {
    async function loadReferences() {
      try {
        setIsReferencesLoading(true);

        const [
          categoriesData,
          countiesData,
          modelsData,
          companiesData,
          branchesData,
          citiesData,
        ] = await Promise.all([
          getCategories(),
          getCounties(),
          getModels(),
          getCompanies(),
          getCompanyBranches(),
          getCities(),
        ]);

        setCategories(categoriesData);
        setCounties(countiesData);
        setModels(modelsData);
        setCompanies(companiesData);
        setBranches(branchesData);
        setCities(citiesData);
      } catch (error) {
        console.error(error);

        showToast({
          variant: "error",
          title: "Andmete laadimine ebaõnnestus",
          message: "Sõiduki muutmise vormi andmeid ei õnnestunud laadida.",
        });
      } finally {
        setIsReferencesLoading(false);
      }
    }

    if (isOpen) {
      loadReferences();
    }
  }, [isOpen, showToast]);

  useEffect(() => {
    if (!isOpen || !vehicle) {
      return;
    }

    const currentFirstPhoto = vehicle.photos?.[0] ?? null;
    const currentFirstPhotoCityId = getPhotoCityId(currentFirstPhoto);
    const nextModelId = getVehicleModelId(vehicle);
    const nextBranchId = getVehicleBranchId(vehicle);

    setUseNewModel(false);
    setCategoryId(getVehicleCategoryId(vehicle));
    setModelId(nextModelId ? String(nextModelId) : "");
    setNewModelManufacturer("");
    setNewModelName("");
    setNewModelCategoryId("");

    setUseNewBranch(false);
    setBranchId(nextBranchId ? String(nextBranchId) : "");
    setCompanyFilterId("");
    setNewBranchName("");

    setUseNewBranchCompany(false);
    setNewBranchCompanyId("");
    setNewCompanyName("");

    setUseNewCompanyCity(false);
    setNewCompanyCityId("");
    setNewCompanyCityName("");
    setNewCompanyCityCountyId("");

    setUseNewBranchCity(false);
    setNewBranchCityId("");
    setNewBranchCityName("");
    setNewBranchCityCountyId("");

    setRegNumber(vehicle.reg_number ?? "");
    setVlaYear(vehicle.vla_year ? String(vehicle.vla_year) : "");
    setVinCode(vehicle.vin_code ?? "");
    setChassis(vehicle.chassis ?? "");
    setCondition(vehicle.condition ?? "Teadmata");

    setSelectedFirstPhotoFile(null);
    setPhotoCityId(
      currentFirstPhotoCityId ? String(currentFirstPhotoCityId) : ""
    );
    setUseNewPhotoCity(false);
    setNewPhotoCityName("");
    setNewPhotoCityCountyId("");
    setPhotoPlace(currentFirstPhoto?.place ?? "");
    setPhotoTakenAt(toDateInputValue(currentFirstPhoto?.taken_at));

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [isOpen, vehicle]);

  useEffect(() => {
    if (!isOpen || !currentBranchId || branchesForSelect.length === 0) {
      return;
    }

    const branch = branchesForSelect.find(
      (item) => item.branch_id === currentBranchId
    );

    if (branch) {
      setCompanyFilterId(String(branch.company_id));
    }
  }, [branchesForSelect, currentBranchId, isOpen]);

  function handleClose() {
    if (isSubmitting) {
      return;
    }

    onClose();
  }

  function handleUseNewModel(value: boolean) {
    setUseNewModel(value);
    setCategoryId(value ? "" : getVehicleCategoryId(vehicle));
    setModelId(value ? "" : currentModelId ? String(currentModelId) : "");
    setNewModelManufacturer("");
    setNewModelName("");
    setNewModelCategoryId("");
  }

  function handleUseNewBranch(value: boolean) {
    setUseNewBranch(value);
    setBranchId(value ? "" : currentBranchId ? String(currentBranchId) : "");
    setCompanyFilterId("");
    setNewBranchName("");
    setUseNewBranchCompany(false);
    setNewBranchCompanyId("");
    setNewCompanyName("");
    setUseNewCompanyCity(false);
    setNewCompanyCityId("");
    setNewCompanyCityName("");
    setNewCompanyCityCountyId("");
    setUseNewBranchCity(false);
    setNewBranchCityId("");
    setNewBranchCityName("");
    setNewBranchCityCountyId("");
  }

  function handleFirstPhotoFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;

    if (!file) {
      setSelectedFirstPhotoFile(null);
      return;
    }

    if (!isAllowedImageFile(file)) {
      setSelectedFirstPhotoFile(null);
      event.target.value = "";

      showToast({
        variant: "error",
        title: "Vale failitüüp",
        message: "Lubatud on ainult PNG, JPG või JPEG pildifailid.",
      });

      return;
    }

    setSelectedFirstPhotoFile(file);
  }

  function handleUseNewPhotoCity(value: boolean) {
    setUseNewPhotoCity(value);

    if (value) {
      setPhotoCityId("");
    } else {
      setNewPhotoCityName("");
      setNewPhotoCityCountyId("");
    }
  }

  function isFirstPhotoChanged() {
    if (!firstPhoto || !firstPhotoCanModify) {
      return false;
    }

    if (selectedFirstPhotoFile) {
      return true;
    }

    if (useNewPhotoCity) {
      return true;
    }

    const nextCityId = photoCityId ? Number(photoCityId) : null;

    if ((firstPhotoCityId ?? null) !== nextCityId) {
      return true;
    }

    if ((firstPhoto.place ?? "") !== photoPlace.trim()) {
      return true;
    }

    if (firstPhotoInitialDate !== photoTakenAt) {
      return true;
    }

    return false;
  }

  function validateForm() {
    if (!vehicle) {
      return false;
    }

    if (vehicle.status === "Kinnitatud") {
      showToast({
        variant: "error",
        title: "Muutmine pole lubatud",
        message: "Kinnitatud sõidukit ei saa muuta.",
      });

      return false;
    }

    if (useNewModel) {
      if (!newModelManufacturer.trim() || !newModelName.trim()) {
        showToast({
          variant: "error",
          title: "Mudel puudub",
          message: "Uue mudeli jaoks sisesta tootja ja mudeli nimi.",
        });

        return false;
      }

      if (!newModelCategoryId) {
        showToast({
          variant: "error",
          title: "Kategooria puudub",
          message: "Uue mudeli jaoks vali kategooria.",
        });

        return false;
      }
    } else if (!modelId) {
      showToast({
        variant: "error",
        title: "Mudel puudub",
        message: "Vali olemasolev mudel või lisa uus mudel.",
      });

      return false;
    }

    if (useNewBranch) {
      if (useNewBranchCompany) {
        if (!newCompanyName.trim()) {
          showToast({
            variant: "error",
            title: "Ettevõte puudub",
            message: "Uue ettevõtte jaoks sisesta ettevõtte nimi.",
          });

          return false;
        }

        if (useNewCompanyCity) {
          if (!newCompanyCityName.trim() || !newCompanyCityCountyId) {
            showToast({
              variant: "error",
              title: "Ettevõtte linn puudub",
              message: "Sisesta uue ettevõtte linna nimi ja maakond.",
            });

            return false;
          }
        } else if (!newCompanyCityId) {
          showToast({
            variant: "error",
            title: "Ettevõtte linn puudub",
            message: "Vali ettevõtte linn või lisa uus linn.",
          });

          return false;
        }
      } else if (!newBranchCompanyId) {
        showToast({
          variant: "error",
          title: "Ettevõte puudub",
          message: "Uue filiaali jaoks vali ettevõte või lisa uus ettevõte.",
        });

        return false;
      }

      if (useNewBranchCity) {
        if (!newBranchCityName.trim() || !newBranchCityCountyId) {
          showToast({
            variant: "error",
            title: "Filiaali linn puudub",
            message: "Sisesta uue filiaali linna nimi ja maakond.",
          });

          return false;
        }
      } else if (!newBranchCityId) {
        showToast({
          variant: "error",
          title: "Filiaali linn puudub",
          message: "Vali filiaali linn või lisa uus linn.",
        });

        return false;
      }
    }

    if (!regNumber.trim()) {
      showToast({
        variant: "error",
        title: "Registrinumber puudub",
        message: "Sisesta sõiduki registrinumber.",
      });

      return false;
    }

    const parsedYear = vlaYear ? Number(vlaYear) : null;

    if (
      parsedYear !== null &&
      (!Number.isInteger(parsedYear) ||
        parsedYear < 1900 ||
        parsedYear > new Date().getFullYear() + 1)
    ) {
      showToast({
        variant: "error",
        title: "Vale väljalaskeaasta",
        message: "Sisesta korrektne väljalaskeaasta.",
      });

      return false;
    }

    if (firstPhotoCanModify) {
      if (useNewPhotoCity) {
        if (!newPhotoCityName.trim()) {
          showToast({
            variant: "error",
            title: "Linna nimi puudub",
            message: "Uue linna lisamiseks sisesta linna nimi.",
          });

          return false;
        }

        if (!newPhotoCityCountyId) {
          showToast({
            variant: "error",
            title: "Maakond puudub",
            message: "Uue linna lisamiseks vali maakond.",
          });

          return false;
        }
      }

      if (isPhotoPlaceRequired && !photoPlace.trim()) {
        showToast({
          variant: "error",
          title: "Koht puudub",
          message: "Kui linn ei ole valitud, siis peab koht olema täidetud.",
        });

        return false;
      }

      if (!photoTakenAt) {
        showToast({
          variant: "error",
          title: "Kuupäev puudub",
          message: "Pildistamise kuupäev peab olema täidetud.",
        });

        return false;
      }

      if (photoTakenAt > today) {
        showToast({
          variant: "error",
          title: "Vale kuupäev",
          message: "Pildistamise kuupäev ei saa olla tulevikus.",
        });

        return false;
      }

      if (selectedFirstPhotoFile && !isAllowedImageFile(selectedFirstPhotoFile)) {
        showToast({
          variant: "error",
          title: "Vale failitüüp",
          message: "Lubatud on ainult PNG, JPG või JPEG pildifailid.",
        });

        return false;
      }
    }

    return true;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!validateForm() || !vehicle) {
      return;
    }

    const parsedYear = vlaYear ? Number(vlaYear) : null;

    try {
      setIsSubmitting(true);

      await updateVehicleRequest(vehicle.vehicle_id, {
        ...(useNewModel
          ? {
              new_model: {
                manufacturer: newModelManufacturer.trim(),
                name: newModelName.trim(),
                category_id: Number(newModelCategoryId),
              },
            }
          : {
              model_id: Number(modelId),
            }),

        ...(useNewBranch
          ? {
              new_branch: {
                branch_name: newBranchName.trim() || null,
                ...(useNewBranchCompany
                  ? {
                      new_company: {
                        name: newCompanyName.trim(),
                        ...(useNewCompanyCity
                          ? {
                              new_city: {
                                name: newCompanyCityName.trim(),
                                county_id: Number(newCompanyCityCountyId),
                              },
                            }
                          : {
                              city_id: Number(newCompanyCityId),
                            }),
                      },
                    }
                  : {
                      company_id: Number(newBranchCompanyId),
                    }),
                ...(useNewBranchCity
                  ? {
                      new_city: {
                        name: newBranchCityName.trim(),
                        county_id: Number(newBranchCityCountyId),
                      },
                    }
                  : {
                      city_id: Number(newBranchCityId),
                    }),
              },
            }
          : {
              branch_id: branchId ? Number(branchId) : null,
            }),

        reg_number: regNumber.trim().toUpperCase(),
        vla_year: parsedYear,
        vin_code: vinCode.trim() || null,
        chassis: chassis.trim() || null,
        condition,
      });

      if (firstPhoto && firstPhotoCanModify && isFirstPhotoChanged()) {
        await updatePhotoRequest(firstPhoto.photo_id, {
          ...(useNewPhotoCity
            ? {
                new_city: {
                  name: newPhotoCityName.trim(),
                  county_id: Number(newPhotoCityCountyId),
                },
              }
            : photoCityId
              ? {
                  city_id: Number(photoCityId),
                }
              : {
                  city_id: null,
                }),

          place: photoPlace.trim() || null,
          taken_at: new Date(`${photoTakenAt}T00:00:00.000Z`).toISOString(),
          ...(selectedFirstPhotoFile ? { image: selectedFirstPhotoFile } : {}),
        });
      }

      showToast({
        variant: "success",
        title: "Sõiduk muudetud",
        message: "Sõiduk saadeti uuesti modereerimisele.",
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);

      showToast({
        variant: "error",
        title: "Muutmine ebaõnnestus",
        message:
          "Kontrolli andmeid. Registrinumber võib juba olemas olla või mõni väli on vigane.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!vehicle) {
    return null;
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="xl">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-600">
          Muuda sõidukit
        </p>

        <h2 className="mt-2 text-2xl font-bold text-slate-900">
          Muuda sõidukikaarti
        </h2>

        <p className="mt-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600 ring-1 ring-slate-200">
          Pärast muutmist pannakse sõiduk uuesti staatusega{" "}
          <span className="font-semibold text-slate-900">Ootel</span>.
        </p>

        <p className="mt-3 text-xs text-slate-500">
          Tärniga <span className="font-bold text-red-500">*</span> märgitud
          väljad on kohustuslikud.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-6" lang="et-EE">
        <section className="rounded-3xl bg-slate-50 p-4 ring-1 ring-slate-200">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-sm font-extrabold uppercase tracking-[0.18em] text-slate-500">
              Mudel
            </h3>

            <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-bold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-100">
              <input
                type="checkbox"
                checked={useNewModel}
                onChange={(event) => handleUseNewModel(event.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              Lisa uus mudel
            </label>
          </div>

          {!useNewModel ? (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <RequiredLabel>Kategooria filter</RequiredLabel>

                <select
                  value={categoryId}
                  onChange={(event) => {
                    setCategoryId(event.target.value);
                    setModelId("");
                  }}
                  disabled={isReferencesLoading}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition disabled:cursor-not-allowed disabled:opacity-60 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                >
                  <option value="">Kõik kategooriad / ära filtreeri</option>

                  {categoriesForSelect.map((category) => (
                    <option
                      key={category.category_id}
                      value={category.category_id}
                    >
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <RequiredLabel required>Mudel</RequiredLabel>

                <select
                  value={modelId}
                  onChange={(event) => setModelId(event.target.value)}
                  disabled={isReferencesLoading}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition disabled:cursor-not-allowed disabled:opacity-60 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  required={!useNewModel}
                >
                  <option value="">
                    {isReferencesLoading ? "Laadin..." : "Vali mudel"}
                  </option>

                  {filteredModels.map((model) => (
                    <option key={model.model_id} value={model.model_id}>
                      {model.manufacturer} {model.name} ·{" "}
                      {model.category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <div>
                <RequiredLabel required>Tootja</RequiredLabel>

                <input
                  type="text"
                  value={newModelManufacturer}
                  onChange={(event) =>
                    setNewModelManufacturer(event.target.value)
                  }
                  placeholder="Näiteks Volvo"
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  required={useNewModel}
                />
              </div>

              <div>
                <RequiredLabel required>Mudeli nimi</RequiredLabel>

                <input
                  type="text"
                  value={newModelName}
                  onChange={(event) => setNewModelName(event.target.value)}
                  placeholder="Näiteks 7900"
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  required={useNewModel}
                />
              </div>

              <div>
                <RequiredLabel required>Kategooria</RequiredLabel>

                <select
                  value={newModelCategoryId}
                  onChange={(event) =>
                    setNewModelCategoryId(event.target.value)
                  }
                  disabled={isReferencesLoading}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition disabled:cursor-not-allowed disabled:opacity-60 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  required={useNewModel}
                >
                  <option value="">Vali kategooria</option>

                  {categoriesForSelect.map((category) => (
                    <option
                      key={category.category_id}
                      value={category.category_id}
                    >
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <p className="md:col-span-3 text-xs leading-5 text-slate-500">
                Uus mudel lisatakse esmalt staatusega{" "}
                <span className="font-semibold text-slate-700">Ootel</span>.
              </p>
            </div>
          )}
        </section>

        <section className="rounded-3xl bg-slate-50 p-4 ring-1 ring-slate-200">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-sm font-extrabold uppercase tracking-[0.18em] text-slate-500">
              Ettevõte ja filiaal
            </h3>

            <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-bold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-100">
              <input
                type="checkbox"
                checked={useNewBranch}
                onChange={(event) => handleUseNewBranch(event.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              Lisa uus filiaal
            </label>
          </div>

          {!useNewBranch ? (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <RequiredLabel>Ettevõte filter</RequiredLabel>

                <select
                  value={companyFilterId}
                  onChange={(event) => {
                    setCompanyFilterId(event.target.value);
                    setBranchId("");
                  }}
                  disabled={isReferencesLoading}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition disabled:cursor-not-allowed disabled:opacity-60 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                >
                  <option value="">Kõik ettevõtted / ära filtreeri</option>

                  {companiesForSelect.map((company) => (
                    <option key={company.company_id} value={company.company_id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <RequiredLabel>Filiaal</RequiredLabel>

                <select
                  value={branchId}
                  onChange={(event) => setBranchId(event.target.value)}
                  disabled={isReferencesLoading}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition disabled:cursor-not-allowed disabled:opacity-60 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                >
                  <option value="">Filiaal puudub</option>

                  {filteredBranches.map((branch) => (
                    <option key={branch.branch_id} value={branch.branch_id}>
                      {branch.company.name} ·{" "}
                      {branch.branch_name || "Peafiliaal"} · {branch.city.name},{" "}
                      {branch.city.county.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div className="mt-4 space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <RequiredLabel>Filiaali nimi</RequiredLabel>

                  <input
                    type="text"
                    value={newBranchName}
                    onChange={(event) => setNewBranchName(event.target.value)}
                    placeholder="Näiteks Tallinna osakond"
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />
                </div>

                <div className="flex items-end">
                  <label className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-100">
                    <input
                      type="checkbox"
                      checked={useNewBranchCompany}
                      onChange={(event) => {
                        setUseNewBranchCompany(event.target.checked);
                        setNewBranchCompanyId("");
                        setNewCompanyName("");
                        setUseNewCompanyCity(false);
                        setNewCompanyCityId("");
                        setNewCompanyCityName("");
                        setNewCompanyCityCountyId("");
                      }}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    Lisa uus ettevõte
                  </label>
                </div>
              </div>

              {!useNewBranchCompany ? (
                <div>
                  <RequiredLabel required>Ettevõte</RequiredLabel>

                  <select
                    value={newBranchCompanyId}
                    onChange={(event) =>
                      setNewBranchCompanyId(event.target.value)
                    }
                    disabled={isReferencesLoading}
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition disabled:cursor-not-allowed disabled:opacity-60 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    required={useNewBranch && !useNewBranchCompany}
                  >
                    <option value="">Vali ettevõte</option>

                    {companiesForSelect.map((company) => (
                      <option
                        key={company.company_id}
                        value={company.company_id}
                      >
                        {company.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="rounded-3xl bg-white p-4 ring-1 ring-slate-200">
                  <div>
                    <RequiredLabel required>Uue ettevõtte nimi</RequiredLabel>

                    <input
                      type="text"
                      value={newCompanyName}
                      onChange={(event) => setNewCompanyName(event.target.value)}
                      placeholder="Näiteks Uus Transport OÜ"
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                      required={useNewBranch && useNewBranchCompany}
                    />
                  </div>

                  <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm font-bold text-slate-700">
                      Ettevõtte linn
                    </p>

                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-slate-50 px-4 py-2 text-sm font-bold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-100">
                      <input
                        type="checkbox"
                        checked={useNewCompanyCity}
                        onChange={(event) => {
                          setUseNewCompanyCity(event.target.checked);
                          setNewCompanyCityId("");
                          setNewCompanyCityName("");
                          setNewCompanyCityCountyId("");
                        }}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      Lisa uus linn
                    </label>
                  </div>

                  {!useNewCompanyCity ? (
                    <div className="mt-3">
                      <RequiredLabel required>Linn</RequiredLabel>

                      <select
                        value={newCompanyCityId}
                        onChange={(event) =>
                          setNewCompanyCityId(event.target.value)
                        }
                        disabled={isReferencesLoading}
                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition disabled:cursor-not-allowed disabled:opacity-60 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                        required={useNewBranch && useNewBranchCompany}
                      >
                        <option value="">Vali linn</option>

                        {citiesForSelect.map((city) => (
                          <option key={city.city_id} value={city.city_id}>
                            {city.name}, {city.county.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="mt-3 grid gap-4 md:grid-cols-2">
                      <div>
                        <RequiredLabel required>Uue linna nimi</RequiredLabel>

                        <input
                          type="text"
                          value={newCompanyCityName}
                          onChange={(event) =>
                            setNewCompanyCityName(event.target.value)
                          }
                          placeholder="Näiteks Tartu"
                          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                        />
                      </div>

                      <div>
                        <RequiredLabel required>Maakond</RequiredLabel>

                        <select
                          value={newCompanyCityCountyId}
                          onChange={(event) =>
                            setNewCompanyCityCountyId(event.target.value)
                          }
                          disabled={isReferencesLoading}
                          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition disabled:cursor-not-allowed disabled:opacity-60 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                        >
                          <option value="">Vali maakond</option>

                          {countiesForSelect.map((county) => (
                            <option
                              key={county.county_id}
                              value={county.county_id}
                            >
                              {county.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="rounded-3xl bg-white p-4 ring-1 ring-slate-200">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm font-bold text-slate-700">
                    Filiaali linn
                  </p>

                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-slate-50 px-4 py-2 text-sm font-bold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-100">
                    <input
                      type="checkbox"
                      checked={useNewBranchCity}
                      onChange={(event) => {
                        setUseNewBranchCity(event.target.checked);
                        setNewBranchCityId("");
                        setNewBranchCityName("");
                        setNewBranchCityCountyId("");
                      }}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    Lisa uus linn
                  </label>
                </div>

                {!useNewBranchCity ? (
                  <div className="mt-3">
                    <RequiredLabel required>Linn</RequiredLabel>

                    <select
                      value={newBranchCityId}
                      onChange={(event) =>
                        setNewBranchCityId(event.target.value)
                      }
                      disabled={isReferencesLoading}
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition disabled:cursor-not-allowed disabled:opacity-60 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                      required={useNewBranch}
                    >
                      <option value="">Vali linn</option>

                      {citiesForSelect.map((city) => (
                        <option key={city.city_id} value={city.city_id}>
                          {city.name}, {city.county.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="mt-3 grid gap-4 md:grid-cols-2">
                    <div>
                      <RequiredLabel required>Uue linna nimi</RequiredLabel>

                      <input
                        type="text"
                        value={newBranchCityName}
                        onChange={(event) =>
                          setNewBranchCityName(event.target.value)
                        }
                        placeholder="Näiteks Pärnu"
                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                      />
                    </div>

                    <div>
                      <RequiredLabel required>Maakond</RequiredLabel>

                      <select
                        value={newBranchCityCountyId}
                        onChange={(event) =>
                          setNewBranchCityCountyId(event.target.value)
                        }
                        disabled={isReferencesLoading}
                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition disabled:cursor-not-allowed disabled:opacity-60 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                      >
                        <option value="">Vali maakond</option>

                        {countiesForSelect.map((county) => (
                          <option
                            key={county.county_id}
                            value={county.county_id}
                          >
                            {county.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              <p className="text-xs leading-5 text-slate-500">
                Uued ettevõtted, filiaalid ja linnad lisatakse esmalt
                modereerimisele.
              </p>
            </div>
          )}
        </section>

        <section className="rounded-3xl bg-slate-50 p-4 ring-1 ring-slate-200">
          <h3 className="text-sm font-extrabold uppercase tracking-[0.18em] text-slate-500">
            Sõiduki andmed
          </h3>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <RequiredLabel required>Registrinumber</RequiredLabel>

              <input
                type="text"
                value={regNumber}
                onChange={(event) => setRegNumber(event.target.value)}
                placeholder="Näiteks 123ABC"
                maxLength={20}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                required
              />
            </div>

            <div>
              <RequiredLabel>Väljalaskeaasta</RequiredLabel>

              <input
                type="number"
                value={vlaYear}
                onChange={(event) => setVlaYear(event.target.value)}
                placeholder="Näiteks 2018"
                min={1900}
                max={new Date().getFullYear() + 1}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div>
              <RequiredLabel>VIN-kood</RequiredLabel>

              <input
                type="text"
                value={vinCode}
                onChange={(event) => setVinCode(event.target.value)}
                placeholder="VIN-kood"
                maxLength={30}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div>
              <RequiredLabel>Šassii</RequiredLabel>

              <input
                type="text"
                value={chassis}
                onChange={(event) => setChassis(event.target.value)}
                placeholder="Šassii info"
                maxLength={100}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div className="md:col-span-2">
              <RequiredLabel>Seisund</RequiredLabel>

              <select
                value={condition}
                onChange={(event) =>
                  setCondition(event.target.value as VehicleCondition)
                }
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              >
                {vehicleConditions.map((item) => (
                  <option key={item} value={item}>
                    {formatCondition(item)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <section className="rounded-3xl bg-slate-50 p-4 ring-1 ring-slate-200">
          <h3 className="text-sm font-extrabold uppercase tracking-[0.18em] text-slate-500">
            Esimene foto
          </h3>

          {!firstPhoto ? (
            <p className="mt-4 rounded-2xl bg-white px-4 py-3 text-sm text-slate-500 ring-1 ring-slate-200">
              Sellel sõidukil ei ole esimest fotot. Foto andmeid ei saa siin
              muuta.
            </p>
          ) : !firstPhotoCanModify ? (
            <p className="mt-4 rounded-2xl bg-white px-4 py-3 text-sm text-slate-500 ring-1 ring-slate-200">
              Esimene foto on kinnitatud ja seda ei saa muuta.
            </p>
          ) : (
            <div className="mt-4 space-y-4">
              <div className="grid gap-4 md:grid-cols-[260px_minmax(0,1fr)]">
                <div className="overflow-hidden rounded-3xl bg-white ring-1 ring-slate-200">
                  <img
                    src={firstPhotoUrl}
                    alt="Esimene foto"
                    className="h-44 w-full object-cover"
                  />
                </div>

                <div>
                  <RequiredLabel>Uus foto</RequiredLabel>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                    onChange={handleFirstPhotoFileChange}
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition file:mr-4 file:rounded-xl file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-blue-600 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />

                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    Kui uut pilti ei vali, jääb vana foto alles. Lubatud
                    failitüübid: PNG, JPG, JPEG.
                  </p>

                  {selectedFirstPhotoFile && (
                    <p className="mt-2 rounded-2xl bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700 ring-1 ring-blue-100">
                      Valitud fail:{" "}
                      <span className="font-bold">
                        {selectedFirstPhotoFile.name}
                      </span>
                    </p>
                  )}
                </div>
              </div>

              <div className="rounded-3xl bg-white p-4 ring-1 ring-slate-200">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-bold text-slate-700">Linn</p>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Vali olemasolev linn, lisa uus linn või jäta linn
                      tühjaks.
                    </p>
                  </div>

                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-slate-50 px-4 py-2 text-sm font-bold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-100">
                    <input
                      type="checkbox"
                      checked={useNewPhotoCity}
                      onChange={(event) =>
                        handleUseNewPhotoCity(event.target.checked)
                      }
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    Lisa uus linn
                  </label>
                </div>

                {!useNewPhotoCity ? (
                  <div className="mt-4">
                    <select
                      value={photoCityId}
                      onChange={(event) => setPhotoCityId(event.target.value)}
                      disabled={isReferencesLoading}
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition disabled:cursor-not-allowed disabled:opacity-60 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    >
                      <option value="">Linn puudub / väljaspool linna</option>

                      {citiesForSelect.map((city) => (
                        <option key={city.city_id} value={city.city_id}>
                          {city.name}, {city.county.name}
                        </option>
                      ))}
                    </select>

                    <p className="mt-2 text-xs leading-5 text-slate-500">
                      Kui linn puudub, siis on koha täitmine kohustuslik.
                    </p>
                  </div>
                ) : (
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div>
                      <RequiredLabel required>Uue linna nimi</RequiredLabel>

                      <input
                        type="text"
                        value={newPhotoCityName}
                        onChange={(event) =>
                          setNewPhotoCityName(event.target.value)
                        }
                        placeholder="Näiteks Narva-Jõesuu"
                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                      />
                    </div>

                    <div>
                      <RequiredLabel required>Maakond</RequiredLabel>

                      <select
                        value={newPhotoCityCountyId}
                        onChange={(event) =>
                          setNewPhotoCityCountyId(event.target.value)
                        }
                        disabled={isReferencesLoading}
                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition disabled:cursor-not-allowed disabled:opacity-60 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                      >
                        <option value="">Vali maakond</option>

                        {countiesForSelect.map((county) => (
                          <option
                            key={county.county_id}
                            value={county.county_id}
                          >
                            {county.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <RequiredLabel required={isPhotoPlaceRequired}>
                  Koht
                </RequiredLabel>

                <input
                  type="text"
                  value={photoPlace}
                  onChange={(event) => setPhotoPlace(event.target.value)}
                  placeholder="Näiteks bussijaam, tänav, peatus..."
                  maxLength={200}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  required={isPhotoPlaceRequired}
                />

                {isPhotoPlaceRequired ? (
                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    Koht on kohustuslik, sest linn ei ole valitud.
                  </p>
                ) : (
                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    Kui linn on valitud või lisad uue linna, võib koha väli
                    jääda tühjaks.
                  </p>
                )}
              </div>

              <div>
                <RequiredLabel required>Pildistamise kuupäev</RequiredLabel>

                <NativeDateInput
                  value={photoTakenAt}
                  onChange={setPhotoTakenAt}
                  max={today}
                  required
                />

                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Tuleviku kuupäeva ei saa valida.
                </p>
              </div>
            </div>
          )}
        </section>

        <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="rounded-2xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Tühista
          </button>

          <button
            type="submit"
            disabled={isSubmitting || isReferencesLoading}
            className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(37,99,235,0.22)] transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "Salvestan..." : "Salvesta muudatused"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default UpdateVehicleModal;