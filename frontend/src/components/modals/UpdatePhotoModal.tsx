import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";

import Modal from "../ui/Modal";
import RequiredLabel from "../ui/RequiredLabel";
import NativeDateInput from "../ui/NativeDateInput";

import { updateMyPhoto } from "../../config/dashboardApi";
import { getCounties } from "../../config/referenceApi";

import { useToast } from "../../hooks/useToast";
import { getCloudinaryImageUrl } from "../../utils/cloudinary";

import type { CityItem, CountyItem } from "../../types/reference";

type UpdatePhotoPayload = Parameters<typeof updateMyPhoto>[1];

type UpdatePhotoRequest = (
  photoId: number,
  data: UpdatePhotoPayload
) => Promise<unknown>;

interface EditablePhoto {
  photo_id: number;
  vehicle_id?: number;

  city_id?: number | null;
  place?: string | null;
  taken_at?: string | null;
  file_path?: string | null;
  status?: string | null;

  city?: {
    city_id: number;
    name: string | null;
    county?: {
      county_id?: number;
      name: string | null;
    } | null;
  } | null;
}

interface Props {
  isOpen: boolean;
  photo: EditablePhoto | null;
  cities: CityItem[];
  onClose: () => void;
  onSuccess: () => void;

  onUpdatePhoto?: UpdatePhotoRequest;
}

const allowedImageTypes = ["image/jpeg", "image/png"];
const allowedImageExtensions = [".jpg", ".jpeg", ".png"];

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

function getPhotoCityId(photo?: EditablePhoto | null) {
  return photo?.city_id ?? photo?.city?.city_id ?? null;
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

function getCityId(city?: CityItem | null) {
  return city?.city_id ?? null;
}

function getCountyId(county?: CountyItem | null) {
  return county?.county_id ?? null;
}

function UpdatePhotoModal({
  isOpen,
  photo,
  cities,
  onClose,
  onSuccess,
  onUpdatePhoto,
}: Props) {
  const { showToast } = useToast();

  const updatePhotoRequest = onUpdatePhoto ?? updateMyPhoto;

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const today = getTodayIsoDate();

  const [counties, setCounties] = useState<CountyItem[]>([]);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [cityId, setCityId] = useState("");
  const [useNewCity, setUseNewCity] = useState(false);
  const [newCityName, setNewCityName] = useState("");
  const [newCityCountyId, setNewCityCountyId] = useState("");
  const [place, setPlace] = useState("");
  const [takenAt, setTakenAt] = useState(getTodayIsoDate());

  const [isReferencesLoading, setIsReferencesLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);



  const currentPhotoCity = useMemo(() => {
    if (!photo?.city?.county) {
      return null;
    }

    const countyId = photo.city.county.county_id;

    if (!countyId) {
      return null;
    }

    return {
      ...photo.city,
      city_id: photo.city.city_id,
      name: photo.city.name ?? "Nimetu linn",
      county_id: countyId,
      county: {
        county_id: countyId,
        name: photo.city.county.name ?? "Nimetu maakond",
      },
    } as CityItem;
  }, [photo?.city]);

  const currentPhotoCounty = useMemo(() => {
    if (!currentPhotoCity?.county) {
      return null;
    }

    return currentPhotoCity.county as CountyItem;
  }, [currentPhotoCity]);

  const citiesForSelect = useMemo(() => {
    return mergeById(cities, currentPhotoCity, getCityId);
  }, [cities, currentPhotoCity]);

  const countiesForSelect = useMemo(() => {
    return mergeById(counties, currentPhotoCounty, getCountyId);
  }, [counties, currentPhotoCounty]);

  const isPlaceRequired = !useNewCity && cityId === "";

  const photoUrl = photo?.file_path
    ? getCloudinaryImageUrl(
        photo.file_path,
        "w_700,h_450,c_fill,q_auto,f_auto"
      )
    : "https://placehold.co/800x500/e2e8f0/475569?text=TransitView";

  useEffect(() => {
    async function loadReferences() {
      try {
        setIsReferencesLoading(true);

        const countiesData = await getCounties();
        setCounties(countiesData);
      } catch (error) {
        console.error(error);

        showToast({
          variant: "error",
          title: "Maakondade laadimine ebaõnnestus",
          message: "Foto muutmise vormi andmeid ei õnnestunud laadida.",
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
    if (!isOpen || !photo) {
      return;
    }

    const nextCityId = getPhotoCityId(photo);

    setSelectedFile(null);
    setCityId(nextCityId ? String(nextCityId) : "");
    setUseNewCity(false);
    setNewCityName("");
    setNewCityCountyId("");
    setPlace(photo.place ?? "");
    setTakenAt(toDateInputValue(photo.taken_at));

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [isOpen, photo]);

  function handleClose() {
    if (isSubmitting) {
      return;
    }

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

  function handleUseNewCity(value: boolean) {
    setUseNewCity(value);

    if (value) {
      setCityId("");
    } else {
      setNewCityName("");
      setNewCityCountyId("");
    }
  }

  function validateForm() {
    if (!photo) {
      return false;
    }

    if (photo.status === "Kinnitatud") {
      showToast({
        variant: "error",
        title: "Muutmine pole lubatud",
        message: "Kinnitatud fotot ei saa muuta.",
      });

      return false;
    }

    if (selectedFile && !isAllowedImageFile(selectedFile)) {
      showToast({
        variant: "error",
        title: "Vale failitüüp",
        message: "Lubatud on ainult PNG, JPG või JPEG pildifailid.",
      });

      return false;
    }

    if (useNewCity) {
      if (!newCityName.trim()) {
        showToast({
          variant: "error",
          title: "Linna nimi puudub",
          message: "Uue linna lisamiseks sisesta linna nimi.",
        });

        return false;
      }

      if (!newCityCountyId) {
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

    return true;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!validateForm() || !photo) {
      return;
    }

    const payload: UpdatePhotoPayload = {
      ...(useNewCity
        ? {
            new_city: {
              name: newCityName.trim(),
              county_id: Number(newCityCountyId),
            },
          }
        : cityId
          ? {
              city_id: Number(cityId),
            }
          : {
              city_id: null,
            }),

      place: place.trim() || null,
      taken_at: new Date(`${takenAt}T00:00:00.000Z`).toISOString(),
      ...(selectedFile ? { image: selectedFile } : {}),
    };

    try {
      setIsSubmitting(true);

      await updatePhotoRequest(photo.photo_id, payload);

      showToast({
        variant: "success",
        title: "Foto muudetud",
        message: "Foto saadeti uuesti modereerimisele.",
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);

      showToast({
        variant: "error",
        title: "Foto muutmine ebaõnnestus",
        message: "Kontrolli andmeid ja proovi uuesti.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!photo) {
    return null;
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-600">
          Muuda fotot
        </p>

        <h2 className="mt-2 text-2xl font-bold text-slate-900">
          Foto andmete muutmine
        </h2>

        <p className="mt-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600 ring-1 ring-slate-200">
          Pärast muutmist pannakse foto uuesti staatusega{" "}
          <span className="font-semibold text-slate-900">Ootel</span>.
          Kui uut pilti ei vali, jääb vana foto alles.
        </p>

        <p className="mt-3 text-xs text-slate-500">
          Tärniga <span className="font-bold text-red-500">*</span> märgitud
          väljad on kohustuslikud.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5" lang="et-EE">
        <section className="rounded-3xl bg-slate-50 p-4 ring-1 ring-slate-200">
          <h3 className="text-sm font-extrabold uppercase tracking-[0.18em] text-slate-500">
            Foto
          </h3>

          <div className="mt-4 grid gap-4 md:grid-cols-[260px_minmax(0,1fr)]">
            <div className="overflow-hidden rounded-3xl bg-white ring-1 ring-slate-200">
              <img
                src={photoUrl}
                alt="Muudetav foto"
                className="h-44 w-full object-cover"
              />
            </div>

            <div>
              <RequiredLabel>Uus foto</RequiredLabel>

              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                onChange={handleFileChange}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition file:mr-4 file:rounded-xl file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-blue-600 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />

              <p className="mt-2 text-xs leading-5 text-slate-500">
                Kui uut pilti ei vali, jääb vana foto alles. Lubatud
                failitüübid: PNG, JPG, JPEG.
              </p>

              {selectedFile && (
                <p className="mt-2 rounded-2xl bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700 ring-1 ring-blue-100">
                  Valitud fail:{" "}
                  <span className="font-bold">{selectedFile.name}</span>
                </p>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-3xl bg-slate-50 p-4 ring-1 ring-slate-200">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-bold text-slate-700">Linn</p>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                Vali olemasolev linn, lisa uus linn või jäta linn tühjaks.
              </p>
            </div>

            <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-bold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-100">
              <input
                type="checkbox"
                checked={useNewCity}
                onChange={(event) => handleUseNewCity(event.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              Lisa uus linn
            </label>
          </div>

          {!useNewCity ? (
            <div className="mt-4">
              <select
                value={cityId}
                onChange={(event) => setCityId(event.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
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
                  value={newCityName}
                  onChange={(event) => setNewCityName(event.target.value)}
                  placeholder="Näiteks Narva-Jõesuu"
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div>
                <RequiredLabel required>Maakond</RequiredLabel>

                <select
                  value={newCityCountyId}
                  onChange={(event) => setNewCityCountyId(event.target.value)}
                  disabled={isReferencesLoading}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition disabled:cursor-not-allowed disabled:opacity-60 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                >
                  <option value="">Vali maakond</option>

                  {countiesForSelect.map((county) => (
                    <option key={county.county_id} value={county.county_id}>
                      {county.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </section>

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
            Tuleviku kuupäeva ei saa valida.
          </p>
        </div>

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

export default UpdatePhotoModal;