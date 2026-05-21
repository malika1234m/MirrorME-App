import { useState } from "react";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";

export interface PickedImage {
  uri: string;
  width: number;
  height: number;
  type: string;
  name: string;
}

export const useImagePicker = () => {
  const [image, setImage] = useState<PickedImage | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const compressImage = async (uri: string): Promise<PickedImage> => {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 1080 } }],
      { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
    );
    return {
      uri: result.uri,
      width: result.width,
      height: result.height,
      type: "image/jpeg",
      name: `outfit_${Date.now()}.jpg`,
    };
  };

  const pickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") throw new Error("Photo library permission denied");

    setIsLoading(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 5],
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        const compressed = await compressImage(result.assets[0].uri);
        setImage(compressed);
        return compressed;
      }
    } finally {
      setIsLoading(false);
    }
    return null;
  };

  const pickFromCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") throw new Error("Camera permission denied");

    setIsLoading(true);
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 5],
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        const compressed = await compressImage(result.assets[0].uri);
        setImage(compressed);
        return compressed;
      }
    } finally {
      setIsLoading(false);
    }
    return null;
  };

  const clearImage = () => setImage(null);

  return { image, isLoading, pickFromGallery, pickFromCamera, clearImage };
};
