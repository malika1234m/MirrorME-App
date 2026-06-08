import { api } from "./api";
import { ApiResponse, Product, SizeRecommendation, UserMeasurements } from "@models/index";

export const wardrobeService = {
  getItems: () =>
    api.get<ApiResponse<Product[]>>("/wardrobe"),

  toggleItem: (productId: string) =>
    api.post<ApiResponse<{ inWardrobe: boolean }>>(`/wardrobe/${productId}/toggle`),

  getCatalog: (params?: { category?: string; gender?: string; search?: string; page?: number }) => {
    const q = new URLSearchParams();
    if (params?.category) q.set("category", params.category);
    if (params?.gender) q.set("gender", params.gender);
    if (params?.search) q.set("search", params.search);
    if (params?.page) q.set("page", String(params.page));
    return api.get<ApiResponse<Product[]>>(`/wardrobe/catalog?${q}`);
  },

  recommendSize: (data: {
    height: number;
    weight: number;
    gender?: string;
    clothingType?: string;
    availableSizes?: string[];
  }) => api.post<ApiResponse<SizeRecommendation>>("/wardrobe/size-recommend", data),

  updateMeasurements: (data: { height?: number; weight?: number; gender?: string }) =>
    api.patch<ApiResponse<UserMeasurements>>("/wardrobe/measurements", data),
};
