import { useAuthStore } from "@store/authStore";

export const useAuth = () => {
  const { user, isAuthenticated, isLoading, login, register, logout, updateUser } =
    useAuthStore();

  return { user, isAuthenticated, isLoading, login, register, logout, updateUser };
};
