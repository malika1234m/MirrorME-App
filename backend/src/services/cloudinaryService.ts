import { cloudinary } from "../config/cloudinary";

export const deleteImage = async (publicId: string): Promise<void> => {
  await cloudinary.uploader.destroy(publicId);
};

export const getOptimizedUrl = (
  publicId: string,
  options: { width?: number; height?: number; crop?: string } = {}
): string =>
  cloudinary.url(publicId, {
    quality: "auto",
    fetch_format: "auto",
    ...options,
  });
