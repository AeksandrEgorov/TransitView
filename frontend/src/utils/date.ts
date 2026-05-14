// This file has date helpers.

export function getTodayIsoDate() {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());

  return date.toISOString().slice(0, 10);
}

export function formatDateEt(value?: string | Date | null) {
  if (!value) {
    return "Teadmata";
  }

  return new Date(value).toLocaleDateString("et-EE");
}

export function toDateInputValue(value?: string | Date | null) {
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

export function isoToEstonianDate(value?: string | null) {
  if (!value) {
    return "";
  }

  const isoDate = value.slice(0, 10);
  const [year, month, day] = isoDate.split("-");

  if (!year || !month || !day) {
    return "";
  }

  return `${day}.${month}.${year}`;
}

export function estonianDateToIso(value: string) {
  const match = value.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);

  if (!match) {
    return null;
  }

  const [, day, month, year] = match;
  const isoDate = `${year}-${month}-${day}`;

  const parsedDate = new Date(`${isoDate}T00:00:00.000Z`);

  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  const isSameDate =
    parsedDate.getUTCFullYear() === Number(year) &&
    parsedDate.getUTCMonth() + 1 === Number(month) &&
    parsedDate.getUTCDate() === Number(day);

  return isSameDate ? isoDate : null;
}

export function formatDateInput(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);

  if (digits.length <= 2) {
    return digits;
  }

  if (digits.length <= 4) {
    return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  }

  return `${digits.slice(0, 2)}.${digits.slice(2, 4)}.${digits.slice(4)}`;
}

export function isIsoDateInRange(
  isoDate: string,
  options: {
    min?: string;
    max?: string;
  }
) {
  if (options.min && isoDate < options.min) {
    return false;
  }

  if (options.max && isoDate > options.max) {
    return false;
  }

  return true;
}
