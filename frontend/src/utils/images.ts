// This file has images helpers.

const allowedImageTypes = ["image/jpeg", "image/png"];
const allowedImageExtensions = [".jpg", ".jpeg", ".png"];

export function isAllowedImageFile(file: File) {
  const fileName = file.name.toLowerCase();

  const hasAllowedType = allowedImageTypes.includes(file.type);
  const hasAllowedExtension = allowedImageExtensions.some((extension) =>
    fileName.endsWith(extension)
  );

  return hasAllowedType && hasAllowedExtension;
}
