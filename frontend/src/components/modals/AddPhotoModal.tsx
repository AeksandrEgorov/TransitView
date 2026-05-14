import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";

import Modal from "../ui/Modal";
import RequiredLabel from "../ui/RequiredLabel";
import NativeDateInput from "../ui/NativeDateInput";
import { createPhoto, uploadPhotoFile } from "../../config/photoApi";
import { getCounties } from "../../config/referenceApi";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../hooks/useToast";
import type { CityItem, CountyItem } from "../../types/reference";
import { getTodayIsoDate } from "../../utils/date";

interface Props {
  isOpen: boolean;
  vehicleId: number;
  cities: CityItem[];
  onClose: () => void;
  onSuccess: () => void;
}

const allowedImageTypes = ["image/jpeg", "image/png"];
const allowedImageExtensions = [".jpg", ".jpeg", ".png"];

function isAllowedImageFile(file: File) {
  const fileName = file.name.toLowerCase();

  const hasAllowedType = allowedImageTypes.includes(file.type);
  const hasAllowedExtension = allowedImageExtensions.some((extension) =>
    fileName.endsWith(extension)
  );

  return hasAllowedType && hasAllowedExtension;
}

function AddPhotoModal({
  isOpen,
  vehicleId,
  cities,
  onClose,
  onSuccess,
}: Props) {
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const today = getTodayIsoDate();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [cityId, setCityId] = useState("");
  const [useNewCity, setUseNewCity] = useState(false);
  const [newCityName, setNewCityName] = useState("");
  const [newCityCountyId, setNewCityCountyId] = useState("");

  const [place, setPlace] = useState("");
  const [takenAt, setTakenAt] = useState(getTodayIsoDate());

  const [counties, setCounties] = useState<CountyItem[]>([]);
  const [isCountiesLoading, setIsCountiesLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const cityCounties = useMemo(() => {
    const map = new Map<number, CountyItem>();

    cities.forEach((city) => {
      map.set(city.county.county_id, city.county);
    });

    return Array.from(map.values()).sort((firstCounty, secondCounty) =>
      firstCounty.name.localeCompare(secondCounty.name, "et")
    );
  }, [cities]);

  const availableCounties = counties.length > 0 ? counties : cityCounties;

  const isPlaceRequired = !useNewCity && cityId === "";

  useEffect(() => {
    async function loadCounties() {
      try {
        setIsCountiesLoading(true);

        const data = await getCounties();
        setCounties(data);
      } catch (error) {
        console.error(error);

        showToast({
          variant: "error",
          title: "Maakondade laadimine ebaõnnestus",
          message:
            "Uue linna lisamise jaoks ei õnnestunud maakondi laadida.",
        });
      } finally {
        setIsCountiesLoading(false);
      }
    }

    if (isOpen) {
      loadCounties();
    }
  }, [isOpen, showToast]);

  function resetForm() {
    setSelectedFile(null);

    setCityId("");
    setUseNewCity(false);
    setNewCityName("");
    setNewCityCountyId("");

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

  function handleUseNewCityChange(value: boolean) {
    setUseNewCity(value);

    if (value) {
      setCityId("");
    } else {
      setNewCityName("");
      setNewCityCountyId("");
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isAuthenticated) {
      showToast({
        variant: "error",
        title: "Sisselogimine on vajalik",
        message: "Foto lisamiseks pead olema sisse logitud.",
      });

      return;
    }

    if (!selectedFile) {
      showToast({
        variant: "error",
        title: "Pilt puudub",
        message: "Vali foto, mida soovid lisada.",
      });

      return;
    }

    if (!isAllowedImageFile(selectedFile)) {
      showToast({
        variant: "error",
        title: "Vale failitüüp",
        message: "Lubatud on ainult PNG, JPG või JPEG pildifailid.",
      });

      return;
    }

    if (useNewCity) {
      if (!newCityName.trim()) {
        showToast({
          variant: "error",
          title: "Linna nimi puudub",
          message: "Uue linna lisamiseks sisesta linna nimi.",
        });

        return;
      }

      if (!newCityCountyId) {
        showToast({
          variant: "error",
          title: "Maakond puudub",
          message: "Uue linna lisamiseks vali maakond.",
        });

        return;
      }
    }

    if (isPlaceRequired && !place.trim()) {
      showToast({
        variant: "error",
        title: "Koht puudub",
        message: "Kui linn ei ole valitud, siis peab koht olema täidetud.",
      });

      return;
    }

    if (!takenAt) {
      showToast({
        variant: "error",
        title: "Kuupäev puudub",
        message: "Pildistamise kuupäev peab olema täidetud.",
      });

      return;
    }

    if (takenAt > today) {
      showToast({
        variant: "error",
        title: "Vale kuupäev",
        message: "Pildistamise kuupäev ei saa olla tulevikus.",
      });

      return;
    }

    try {
      setIsSubmitting(true);

      const uploaded = await uploadPhotoFile(selectedFile);

      await createPhoto({
        vehicle_id: vehicleId,
        ...(useNewCity
          ? {
              new_city: {
                name: newCityName.trim(),
                county_id: Number(newCityCountyId),
              },
            }
          : cityId
            ? { city_id: Number(cityId) }
            : {}),
        ...(place.trim() ? { place: place.trim() } : {}),
        taken_at: new Date(`${takenAt}T00:00:00.000Z`).toISOString(),
        file_path: uploaded.file_path,
        cloudinary_public_id: uploaded.public_id,
      });

      showToast({
        variant: "success",
        title: "Foto lisatud",
        message: useNewCity
          ? "Foto ja uus linn saadeti modereerimisele."
          : "Foto saadeti modereerimisele.",
      });

      resetForm();
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);

      showToast({
        variant: "error",
        title: "Foto lisamine ebaõnnestus",
        message: "Kontrolli andmeid ja proovi uuesti.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-600">
          Lisa foto
        </p>

        <h2 className="mt-2 text-2xl font-bold text-slate-900">
          Lisa sõidukile uus foto
        </h2>

        <p className="mt-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600 ring-1 ring-slate-200">
          Foto lisatakse esmalt staatusega{" "}
          <span className="font-semibold text-slate-900">Ootel</span>.
          Avalikult nähtavaks muutub see pärast modereerimist.
        </p>

        <p className="mt-3 text-xs text-slate-500">
          Tärniga <span className="font-bold text-red-500">*</span> märgitud
          väljad on kohustuslikud.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5" lang="et-EE">
        <div>
          <RequiredLabel required>Foto</RequiredLabel>

          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,image/jpeg,image/png"
            onChange={handleFileChange}
            className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition file:mr-4 file:rounded-xl file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-blue-600 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
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

        <div className="rounded-3xl bg-slate-50 p-4 ring-1 ring-slate-200">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <RequiredLabel required={useNewCity ? false : undefined}>
                Linn
              </RequiredLabel>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                Vali olemasolev linn või lisa uus linn modereerimiseks.
              </p>
            </div>

            <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-bold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-100">
              <input
                type="checkbox"
                checked={useNewCity}
                onChange={(event) =>
                  handleUseNewCityChange(event.target.checked)
                }
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
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
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
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <RequiredLabel required>Uue linna nimi</RequiredLabel>

                <input
                  type="text"
                  value={newCityName}
                  onChange={(event) => setNewCityName(event.target.value)}
                  placeholder="Näiteks Narva-Jõesuu"
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  required={useNewCity}
                />
              </div>

              <div>
                <RequiredLabel required>Maakond</RequiredLabel>

                <select
                  value={newCityCountyId}
                  onChange={(event) =>
                    setNewCityCountyId(event.target.value)
                  }
                  disabled={isCountiesLoading}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition disabled:cursor-not-allowed disabled:opacity-60 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  required={useNewCity}
                >
                  <option value="">
                    {isCountiesLoading ? "Laadin..." : "Vali maakond"}
                  </option>

                  {availableCounties.map((county) => (
                    <option key={county.county_id} value={county.county_id}>
                      {county.name}
                    </option>
                  ))}
                </select>
              </div>

              <p className="sm:col-span-2 text-xs leading-5 text-slate-500">
                Uus linn lisatakse esmalt staatusega{" "}
                <span className="font-semibold text-slate-700">Ootel</span>.
                Moderaator kinnitab selle koos fotoga.
              </p>
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
            className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
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
            disabled={isSubmitting}
            className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(37,99,235,0.22)] transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "Lisamine..." : "Lisa foto"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default AddPhotoModal;