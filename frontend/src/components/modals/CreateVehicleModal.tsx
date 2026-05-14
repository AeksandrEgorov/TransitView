import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";

import Modal from "../ui/Modal";
import RequiredLabel from "../ui/RequiredLabel";
import NativeDateInput from "../ui/NativeDateInput";

import { createMyVehicle } from "../../config/dashboardApi";
import {
  getCategories,
  getCities,
  getCompanies,
  getCompanyBranches,
  getCounties,
  getModels,
} from "../../config/referenceApi";

import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../hooks/useToast";
import { getTodayIsoDate } from "../../utils/date";

import type {
  CategoryItem,
  CityItem,
  CompanyBranchItem,
  CompanyItem,
  CountyItem,
  ModelItem,
} from "../../types/reference";
import type { VehicleCondition } from "../../types/vehicle";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
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

function CreateVehicleModal({ isOpen, onClose, onSuccess }: Props) {
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();

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

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

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

  const [photoCityId, setPhotoCityId] = useState("");
  const [useNewPhotoCity, setUseNewPhotoCity] = useState(false);
  const [newPhotoCityName, setNewPhotoCityName] = useState("");
  const [newPhotoCityCountyId, setNewPhotoCityCountyId] = useState("");

  const [place, setPlace] = useState("");
  const [takenAt, setTakenAt] = useState(getTodayIsoDate());

  const filteredModels = useMemo(() => {
    if (!categoryId) {
      return models;
    }

    return models.filter((model) => model.category_id === Number(categoryId));
  }, [models, categoryId]);

  const filteredBranches = useMemo(() => {
    if (!companyFilterId) {
      return branches;
    }

    return branches.filter(
      (branch) => branch.company_id === Number(companyFilterId)
    );
  }, [branches, companyFilterId]);

  const isPlaceRequired = !useNewPhotoCity && photoCityId === "";

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
          message: "Sõiduki lisamise vormi andmeid ei õnnestunud laadida.",
        });
      } finally {
        setIsReferencesLoading(false);
      }
    }

    if (isOpen) {
      loadReferences();
    }
  }, [isOpen, showToast]);

  function resetForm() {
    setSelectedFile(null);

    setUseNewModel(false);
    setCategoryId("");
    setModelId("");
    setNewModelManufacturer("");
    setNewModelName("");
    setNewModelCategoryId("");

    setCompanyFilterId("");
    setBranchId("");

    setUseNewBranch(false);
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

    setRegNumber("");
    setVlaYear("");
    setVinCode("");
    setChassis("");
    setCondition("Teadmata");

    setPhotoCityId("");
    setUseNewPhotoCity(false);
    setNewPhotoCityName("");
    setNewPhotoCityCountyId("");

    setPlace("");
    setTakenAt(getTodayIsoDate());

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleClose() {
    if (isSubmitting) {
      return;
    }

    resetForm();
    onClose();
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;

    if (!file) {
      setSelectedFile(null);
      return;
    }

    if (!isAllowedImageFile(file)) {
      setSelectedFile(null);
      event.target.value = "";

      showToast({
        variant: "error",
        title: "Vale failitüüp",
        message: "Lubatud on ainult PNG, JPG või JPEG pildifailid.",
      });

      return;
    }

    setSelectedFile(file);
  }

  function handleUseNewModel(value: boolean) {
    setUseNewModel(value);
    setModelId("");
    setCategoryId("");
    setNewModelManufacturer("");
    setNewModelName("");
    setNewModelCategoryId("");
  }

  function handleUseNewBranch(value: boolean) {
    setUseNewBranch(value);
    setBranchId("");
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

  function handleUseNewPhotoCity(value: boolean) {
    setUseNewPhotoCity(value);

    if (value) {
      setPhotoCityId("");
    } else {
      setNewPhotoCityName("");
      setNewPhotoCityCountyId("");
    }
  }

  function validateForm() {
    if (!isAuthenticated) {
      showToast({
        variant: "error",
        title: "Sisselogimine on vajalik",
        message: "Sõiduki lisamiseks pead olema sisse logitud.",
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

    if (isPlaceRequired && !place.trim()) {
      showToast({
        variant: "error",
        title: "Koht puudub",
        message: "Kui linn ei ole valitud, siis peab koht olema täidetud.",
      });

      return false;
    }

    if (!takenAt) {
      showToast({
        variant: "error",
        title: "Kuupäev puudub",
        message: "Pildistamise kuupäev peab olema täidetud.",
      });

      return false;
    }

    if (takenAt > today) {
      showToast({
        variant: "error",
        title: "Vale kuupäev",
        message: "Pildistamise kuupäev ei saa olla tulevikus.",
      });

      return false;
    }

    if (!selectedFile) {
      showToast({
        variant: "error",
        title: "Foto puudub",
        message: "Sõiduki lisamiseks peab olema vähemalt üks foto.",
      });

      return false;
    }

    if (!isAllowedImageFile(selectedFile)) {
      showToast({
        variant: "error",
        title: "Vale failitüüp",
        message: "Lubatud on ainult PNG, JPG või JPEG pildifailid.",
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

    return true;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!validateForm() || !selectedFile) {
      return;
    }

    const parsedYear = vlaYear ? Number(vlaYear) : null;

    try {
      setIsSubmitting(true);

      await createMyVehicle({
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
          : branchId
            ? {
                branch_id: Number(branchId),
              }
            : {}),

        reg_number: regNumber.trim().toUpperCase(),
        vla_year: parsedYear,
        vin_code: vinCode.trim() || null,
        chassis: chassis.trim() || null,
        condition,

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
            : {}),

        ...(place.trim() ? { place: place.trim() } : {}),
        taken_at: new Date(`${takenAt}T00:00:00.000Z`).toISOString(),
        image: selectedFile,
      });

      showToast({
        variant: "success",
        title: "Sõiduk lisatud",
        message: "Sõiduk ja esimene foto saadeti modereerimisele.",
      });

      resetForm();
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);

      showToast({
        variant: "error",
        title: "Sõiduki lisamine ebaõnnestus",
        message:
          "Kontrolli andmeid. Registrinumber võib juba olemas olla või mõni väli on vigane.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="xl">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-600">
          Lisa sõiduk
        </p>

        <h2 className="mt-2 text-2xl font-bold text-slate-900">
          Lisa uus sõidukikaart
        </h2>

        <p className="mt-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600 ring-1 ring-slate-200">
          Sõiduk lisatakse esmalt staatusega{" "}
          <span className="font-semibold text-slate-900">Ootel</span>. Esimene
          foto on kohustuslik.
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

                  {categories.map((category) => (
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

                  {categories.map((category) => (
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

                  {companies.map((company) => (
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
                      {branch.branch_name || "Peafiliaal"} ·{" "}
                      {branch.city.name}, {branch.city.county.name}
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

                    {companies.map((company) => (
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

                        {cities.map((city) => (
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

                          {counties.map((county) => (
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

                      {cities.map((city) => (
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

                        {counties.map((county) => (
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

          <div className="mt-4 space-y-4">
            <div>
              <RequiredLabel required>Foto</RequiredLabel>

              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                onChange={handleFileChange}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition file:mr-4 file:rounded-xl file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-blue-600 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                required
              />

              <p className="mt-2 text-xs leading-5 text-slate-500">
                Lubatud failitüübid: PNG, JPG, JPEG.
              </p>

              {selectedFile && (
                <p className="mt-2 rounded-2xl bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700 ring-1 ring-blue-100">
                  Valitud fail:{" "}
                  <span className="font-bold">{selectedFile.name}</span>
                </p>
              )}
            </div>

            <div className="rounded-3xl bg-white p-4 ring-1 ring-slate-200">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <RequiredLabel required={useNewPhotoCity ? false : undefined}>
                    Linn
                  </RequiredLabel>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Vali olemasolev linn, lisa uus linn või jäta linn tühjaks.
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

                    {cities.map((city) => (
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
                      required={useNewPhotoCity}
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
                      required={useNewPhotoCity}
                    >
                      <option value="">Vali maakond</option>

                      {counties.map((county) => (
                        <option key={county.county_id} value={county.county_id}>
                          {county.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            <div>
              <RequiredLabel required={isPlaceRequired}>Koht</RequiredLabel>

              <input
                type="text"
                value={place}
                onChange={(event) => setPlace(event.target.value)}
                placeholder="Näiteks bussijaam, tänav, peatus..."
                maxLength={200}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                required={isPlaceRequired}
              />

              {isPlaceRequired ? (
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Koht on kohustuslik, sest linn ei ole valitud.
                </p>
              ) : (
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Kui linn on valitud või lisad uue linna, võib koha väli jääda
                  tühjaks.
                </p>
              )}
            </div>

            <div>
              <RequiredLabel required>Pildistamise kuupäev</RequiredLabel>

              <NativeDateInput
                value={takenAt}
                onChange={setTakenAt}
                max={today}
                required
              />

              <p className="mt-2 text-xs leading-5 text-slate-500">
                Vaikimisi kasutatakse tänast kuupäeva. Tuleviku kuupäeva ei saa
                valida.
              </p>
            </div>
          </div>
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
            {isSubmitting ? "Lisamine..." : "Lisa sõiduk"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default CreateVehicleModal;