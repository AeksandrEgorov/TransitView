// This file has upload to cloudinary helpers.

import streamifier from "streamifier";
import cloudinary from "../config/cloudinary.js";

export function uploadBufferToCloudinary(
  fileBuffer: Buffer,
  folder = "transitview"
): Promise<{ secure_url: string; public_id: string }> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        if (!result) {
          reject(new Error("Cloudinary upload failed"));
          return;
        }

        resolve({
          secure_url: result.secure_url,
          public_id: result.public_id,
        });
      }
    );

    streamifier.createReadStream(fileBuffer).pipe(stream);
  });
}

export async function deleteCloudinaryImage(
  publicId: string | null | undefined
) {
  if (!publicId) {
    return;
  }

  await cloudinary.uploader.destroy(publicId, {
    resource_type: "image",
  });
}