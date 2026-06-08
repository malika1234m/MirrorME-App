import { api } from "./api";
import { ApiResponse, Business, User } from "@models/index";

interface AdminStats {
  users: number;
  brands: number;
  pendingVerification: number;
  products: number;
  posts: number;
}

interface AdminBrand extends Omit<Business, "user"> {
  user: { id: string; email: string; username: string; displayName: string | null };
}

interface AdminUser extends Omit<User, "_count"> {
  isAdmin: boolean;
  _count: { posts: number; followers: number };
}

export const adminService = {
  getStats: () => api.get<ApiResponse<AdminStats>>("/admin/stats"),
  listBrands: (status?: string) =>
    api.get<ApiResponse<AdminBrand[]>>(`/admin/brands${status ? `?status=${status}` : ""}`),
  verifyBrand: (id: string) => api.post<ApiResponse<AdminBrand>>(`/admin/brands/${id}/verify`),
  rejectBrand: (id: string, reason?: string) =>
    api.post<ApiResponse<AdminBrand>>(`/admin/brands/${id}/reject`, { reason }),
  revokeBrand: (id: string) => api.post<ApiResponse<AdminBrand>>(`/admin/brands/${id}/revoke`),
  listUsers: () => api.get<ApiResponse<AdminUser[]>>("/admin/users"),
  grantAdmin: (id: string) => api.post<ApiResponse<AdminUser>>(`/admin/users/${id}/grant-admin`),
};
