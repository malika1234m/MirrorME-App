import { api } from "./api";
import { ApiResponse, User } from "@types/index";

interface AuthPayload { user: User; token: string }

export const authService = {
  register: (data: { email: string; username: string; password: string; displayName?: string }) =>
    api.post<ApiResponse<AuthPayload>>("/auth/register", data),

  login: (data: { email: string; password: string }) =>
    api.post<ApiResponse<AuthPayload>>("/auth/login", data),

  getMe: () => api.get<ApiResponse<User>>("/auth/me"),

  updateProfile: (data: FormData) =>
    api.patch<ApiResponse<User>>("/auth/profile", data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
};
