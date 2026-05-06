import { useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";

import Modal from "../ui/Modal";
import { createPhoto, uploadPhotoFile } from "../../config/photoApi";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../hooks/useToast";
import type { CityItem } from "../../types/reference";

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

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [cityId, setCityId] = useState("");
  const [place, setPlace] = useState("");
  const [takenAt, setTakenAt] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const today = new Date().toISOString().slice(0, 10);

  function resetForm() {
    setSelectedFile(null);
    setCityId("");
    setPlace("");
    setTakenAt("");

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

    try {
      setIsSubmitting(true);

      const uploaded = await uploadPhotoFile(selectedFile);

      await createPhoto({
        vehicle_id: vehicleId,
        ...(cityId ? { city_id: Number(cityId) } : {}),
        ...(place.trim() ? { place: place.trim() } : {}),
        ...(takenAt
          ? {
              taken_at: new Date(`${takenAt}T00:00:00.000Z`).toISOString(),
            }
          : {}),
        file_path: uploaded.file_path,
        cloudinary_public_id: uploaded.public_id,
      });

      showToast({
        variant: "success",
        title: "Foto lisatud",
        message: "Foto saadeti modereerimisele.",
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
    <Modal isOpen={isOpen} onClose={handleClose}>
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
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Foto
          </label>

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

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Linn
          </label>

          <select
            value={cityId}
            onChange={(event) => setCityId(event.target.value)}
            className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
          >
            <option value="">Linn puudub / väljaspool linna</option>

            {cities.map((city) => (
              <option key={city.city_id} value={city.city_id}>
                {city.name}, {city.county.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Koht
          </label>

          <input
            type="text"
            value={place}
            onChange={(event) => setPlace(event.target.value)}
            placeholder="Näiteks bussijaam, tänav, peatus..."
            className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Pildistamise kuupäev
          </label>

          <input
            type="date"
            value={takenAt}
            onChange={(event) => setTakenAt(event.target.value)}
            max={today}
            className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
          />
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