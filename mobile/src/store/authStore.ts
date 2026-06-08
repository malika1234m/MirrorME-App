import { create } from "zustand";
import { api } from "@services/api";
import { authService } from "@services/authService";
import { User } from "@models/index";

interface AuthStore {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; username: string; password: string; displayName?: string }) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (email, password) => {
    const res = await authService.login({ email, password });
    if (!res.data) throw new Error("No data returned");
    await api.saveToken(res.data.token);
    set({ user: res.data.user, token: res.data.token, isAuthenticated: true });
  },

  register: async (data) => {
    const res = await authService.register(data);
    if (!res.data) throw new Error("No data returned");
    await api.saveToken(res.data.token);
    set({ user: res.data.user, token: res.data.token, isAuthenticated: true });
  },

  logout: async () => {
    // Invalidate token server-side (increments tokenVersion so existing tokens stop working)
    try { await authService.logout(); } catch {}
    await api.clearToken();
    set({ user: null, token: null, isAuthenticated: false });
  },

  loadUser: async () => {
    set({ isLoading: true });
    try {
      const token = await api.getToken();
      if (!token) { set({ isLoading: false }); return; }
      const res = await authService.getMe();
      if (res.data) set({ user: res.data, token, isAuthenticated: true });
    } catch {
      await api.clearToken();
      set({ user: null, token: null, isAuthenticated: false });
    } finally {
      set({ isLoading: false });
    }
  },

  updateUser: (updates) => {
    const { user } = get();
    if (user) set({ user: { ...user, ...updates } });
  },
}));
