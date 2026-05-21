import axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import * as SecureStore from "expo-secure-store";
import { API_URL } from "@constants/config";

const TOKEN_KEY = "mirrorme_token";

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      timeout: 10_000,
      headers: { "Content-Type": "application/json" },
    });

    this.client.interceptors.request.use(async (config) => {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    });

    this.client.interceptors.response.use(
      (res) => res,
      (error) => {
        const message =
          error.response?.data?.message || error.message || "Something went wrong";
        return Promise.reject(new Error(message));
      }
    );
  }

  async get<T>(url: string, config?: AxiosRequestConfig) {
    const res = await this.client.get<T>(url, config);
    return res.data;
  }

  async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig) {
    const res = await this.client.post<T>(url, data, config);
    return res.data;
  }

  async patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig) {
    const res = await this.client.patch<T>(url, data, config);
    return res.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig) {
    const res = await this.client.delete<T>(url, config);
    return res.data;
  }

  async saveToken(token: string) {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  }

  async clearToken() {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  }

  async getToken() {
    return SecureStore.getItemAsync(TOKEN_KEY);
  }
}

export const api = new ApiService();
