import { api } from "./api";
import { ApiResponse, Business, Product } from "@models/index";

export const businessService = {
  list: (params?: { category?: string; search?: string; page?: number }) => {
    const q = new URLSearchParams();
    if (params?.category) q.set("category", params.category);
    if (params?.search) q.set("search", params.search);
    if (params?.page) q.set("page", String(params.page));
    return api.get<ApiResponse<Business[]>>(`/business?${q}`);
  },

  featured: () => api.get<ApiResponse<Business[]>>("/business/featured"),

  getById: (id: string) => api.get<ApiResponse<Business>>(`/business/${id}`),

  getMe: () => api.get<ApiResponse<Business>>("/business/me"),

  register: (data: {
    brandName: string; category: string; bio?: string;
    website?: string; instagram?: string; location?: string;
  }) => api.post<ApiResponse<Business>>("/business/register", data),

  update: (formData: FormData) =>
    api.patch<ApiResponse<Business>>("/business/me", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  toggleFollow: (id: string) =>
    api.post<ApiResponse<{ following: boolean }>>(`/business/${id}/follow`),

  getProducts: (businessId: string, page = 1) =>
    api.get<ApiResponse<Product[]>>(`/business/${businessId}/products?page=${page}`),

  // Product management
  createProduct: (formData: FormData) =>
    api.post<ApiResponse<Product>>("/products", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  getMyProducts: () => api.get<ApiResponse<Product[]>>("/products/my"),

  updateProduct: (id: string, data: Partial<{ title: string; description: string; price: number; shopLink: string; inStock: boolean }>) =>
    api.patch<ApiResponse<Product>>(`/products/${id}`, data),

  deleteProduct: (id: string) => api.delete<ApiResponse<null>>(`/products/${id}`),

  saveProduct: (id: string) =>
    api.post<ApiResponse<{ saved: boolean }>>(`/products/${id}/save`),

  requestVerification: () =>
    api.post<ApiResponse<Business>>("/business/me/request-verification"),

  // Match
  matchByPhoto: (formData: FormData) =>
    api.post<ApiResponse<{ matches: Product[]; total: number; imageUrl: string }>>("/match", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  getMatchHistory: () =>
    api.get<ApiResponse<{ id: string; imageUrl: string; createdAt: string }[]>>("/match/history"),
};
