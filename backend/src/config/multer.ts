import multer from "multer";
import path from "path";

const storage = multer.memoryStorage();

const allowedMimeTypes = ["image/jpeg", "image/png"];
const allowedExtensions = [".jpg", ".jpeg", ".png"];

const fileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  const fileExtension = path.extname(file.originalname).toLowerCase();

  const hasAllowedMimeType = allowedMimeTypes.includes(file.mimetype);
  const hasAllowedExtension = allowedExtensions.includes(fileExtension);

  if (hasAllowedMimeType && hasAllowedExtension) {
    cb(null, true);
    return;
  }

  cb(
    new Error(
      "Only PNG, JPG and JPEG image files are allowed"
    )
  );
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

export default upload;