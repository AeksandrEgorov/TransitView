import type { SyntheticEvent } from "react";

export function getCloudinaryImageUrl(
  url: string | undefined | null,
  transformation: string
) {
  if (!url) {
    return "";
  }

  const safeUrl = encodeURI(url);

  if (!safeUrl.includes("/upload/")) {
    return safeUrl;
  }

  if (safeUrl.includes(`/upload/${transformation}/`)) {
    return safeUrl;
  }

  return safeUrl.replace("/upload/", `/upload/${transformation}/`);
}

export function getOriginalImageUrl(url: string | undefined | null) {
  if (!url) {
    return "";
  }

  return encodeURI(url);
}

export function fallbackToOriginalImage(
  event: SyntheticEvent<HTMLImageElement>,
  originalUrl: string | undefined | null
) {
  const image = event.currentTarget;
  const fallbackUrl = getOriginalImageUrl(originalUrl);

  if (!fallbackUrl || image.src === fallbackUrl) {
    return;
  }

  image.src = fallbackUrl;
}