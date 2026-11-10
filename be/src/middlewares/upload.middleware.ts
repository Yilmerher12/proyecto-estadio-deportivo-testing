import { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import { AppError } from '../errors/AppError';

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const imageFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError(400, 'Solo se permiten imágenes JPEG, PNG y WebP'));
  }
};

const uploadOptions: multer.Options = {
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE, files: 1, fields: 10 },
  fileFilter: imageFilter,
};

// Avatar del usuario y foto de la concesión: máx 5 MB, un solo archivo.
export const uploadAvatar = multer(uploadOptions);
export const uploadImage = multer(uploadOptions);

// El mimetype de multer sale del header Content-Type que manda el cliente,
// así que se puede falsificar. Se confirma con los magic bytes del buffer.
function hasImageSignature(buf: Buffer): boolean {
  const isJpeg = buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
  const isPng =
    buf.length > 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  const isWebp =
    buf.length > 12 &&
    buf.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buf.subarray(8, 12).toString('ascii') === 'WEBP';
  return isJpeg || isPng || isWebp;
}

export function validateImageSignature(req: Request, _res: Response, next: NextFunction): void {
  if (req.file && !hasImageSignature(req.file.buffer)) {
    return next(new AppError(400, 'El archivo no es una imagen válida'));
  }
  next();
}
