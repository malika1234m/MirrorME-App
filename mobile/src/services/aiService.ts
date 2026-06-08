import { api } from "./api";
import { ApiResponse, OutfitAnalysis, Post } from "@models/index";

export const aiService = {
  getAnalysis: (postId: string) =>
    api.get<ApiResponse<OutfitAnalysis>>(`/ai/analysis/${postId}`),

  getStylistAdvice: (postId: string) =>
    api.get<ApiResponse<{ tips: string[]; analysis: OutfitAnalysis }>>(`/ai/stylist/${postId}`),

  getSimilar: (postId: string, limit = 10) =>
    api.get<ApiResponse<Post[]>>(`/ai/similar/${postId}?limit=${limit}`),

  getTrending: () => api.get<ApiResponse<Post[]>>("/ai/trending"),

  toggleSave: (postId: string) =>
    api.post<ApiResponse<{ saved: boolean }>>(`/ai/save/${postId}`),

  getSaved: () => api.get<ApiResponse<Post[]>>("/ai/saved"),

  reanalyze: (postId: string) =>
    api.post<ApiResponse<OutfitAnalysis>>(`/ai/analyze/${postId}`),
};
