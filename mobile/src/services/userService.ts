import { api } from "./api";
import { ApiResponse, User } from "@models/index";

export const userService = {
  getProfile: (userId: string) =>
    api.get<ApiResponse<User>>(`/users/profile/${userId}`),

  toggleFollow: (userId: string) =>
    api.post<ApiResponse<{ following: boolean }>>(`/users/${userId}/toggle`),

  getFollowers: (userId: string) =>
    api.get<ApiResponse<User[]>>(`/users/${userId}/followers`),

  getFollowing: (userId: string) =>
    api.get<ApiResponse<User[]>>(`/users/${userId}/following`),
};
