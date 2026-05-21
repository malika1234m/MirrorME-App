import { Request, Response, NextFunction } from "express";
import multer from "multer";
import streamifier from "streamifier";
import { cloudinary } from "../config/cloudinary";

// Keep files in memory — we stream directly to Cloudinary
const memoryStorage = multer.memoryStorage();

const multerFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed"));
  }
};

const baseMulter = multer({
  storage: memoryStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: multerFilter,
});

const avatarMulter = multer({
  storage: memoryStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: multerFilter,
});

// Streams a buffer to Cloudinary and attaches result to req.file
const streamToCloudinary = (
  folder: string,
  transformation: object[]
) => async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  if (!req.file) { next(); return; }

  try {
    const result = await new Promise<{ secure_url: string; public_id: string }>(
      (resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder,
            transformation,
            resource_type: "image",
          },
          (error, result) => {
            if (error || !result) reject(error ?? new Error("Cloudinary upload failed"));
            else resolve({ secure_url: result.secure_url, public_id: result.public_id });
          }
        );
        streamifier.createReadStream(req.file!.buffer).pipe(uploadStream);
      }
    );

    // Attach Cloudinary result to multer file object so controllers can read it
    (req.file as Express.Multer.File & { path: string; filename: string }).path =
      result.secure_url;
    (req.file as Express.Multer.File & { path: string; filename: string }).filename =
      result.public_id;

    next();
  } catch (err) {
    next(err);
  }
};

// Compose: parse multipart form → stream to Cloudinary
export const uploadOutfit = [
  baseMulter.single("image"),
  streamToCloudinary("mirrorme/outfits", [
    { width: 1080, crop: "limit" },
    { quality: "auto" },
    { fetch_format: "auto" },
  ]),
];

export const uploadAvatar = [
  avatarMulter.single("avatar"),
  streamToCloudinary("mirrorme/avatars", [
    { width: 400, height: 400, crop: "fill", gravity: "face" },
    { quality: "auto" },
    { fetch_format: "auto" },
  ]),
];

export const uploadStory = [
  baseMulter.single("image"),
  streamToCloudinary("mirrorme/stories", [
    { width: 1080, height: 1920, crop: "fill" },
    { quality: "auto" },
    { fetch_format: "auto" },
  ]),
];

// Match queries: keep buffer in memory only — no Cloudinary upload needed
export const uploadForMatch = baseMulter.single("image");
