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

  logout: () => api.post<ApiResponse<null>>("/auth/logout"),

  forgotPassword: (email: string) =>
    api.post<ApiResponse<null>>("/auth/forgot-password", { email }),

  resetPassword: (token: string, newPassword: string) =>
    api.post<ApiResponse<null>>("/auth/reset-password", { token, newPassword }),

  deleteAccount: (password: string) =>
    api.delete<ApiResponse<null>>("/auth/account", { data: { password } }),
};
