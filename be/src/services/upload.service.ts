// src/services/upload.service.ts
import { cloudinary } from '../config/cloudinary';
import { AppError } from '../errors/AppError';

export interface UploadResult {
  url: string;
  publicId: string;
}

export function uploadToCloudinary(
  buffer: Buffer,
  folder: string,
  publicId?: string,
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const options: Record<string, unknown> = {
      folder,
      resource_type: 'image',
    };
    if (publicId) options.public_id = publicId;

    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error || !result) {
        return reject(new AppError(500, 'Error al subir imagen a Cloudinary'));
      }
      resolve({ url: result.secure_url, publicId: result.public_id });
    });

    stream.end(buffer);
  });
}

export async function deleteFromCloudinary(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId);
}
