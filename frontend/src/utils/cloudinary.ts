export function getCloudinaryImageUrl(
  url: string | undefined | null,
  transformation: string
) {
  if (!url) {
    return "";
  }

  if (!url.includes("/upload/")) {
    return url;
  }

  if (url.includes(`/upload/${transformation}/`)) {
    return url;
  }

  return url.replace("/upload/", `/upload/${transformation}/`);
}