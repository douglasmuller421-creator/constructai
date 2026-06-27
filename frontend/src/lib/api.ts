import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from "axios";
import type { ApiError } from "@/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

// Create axios instance
export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - attach JWT token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const apiError: ApiError = error.response?.data || {
      success: false,
      error: { code: "NETWORK_ERROR", message: "Network error" },
    };

    // Handle 401 - redirect to login
    if (error.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }

    return Promise.reject(apiError);
  }
);

// API service functions
export const authApi = {
  register: (data: { email: string; password: string; name: string }) =>
    api.post("/auth/register", data),
  login: (data: { email: string; password: string }) =>
    api.post("/auth/login", data),
  getProfile: () => api.get("/auth/profile"),
};

export const projectsApi = {
  list: (params?: { page?: number; limit?: number; status?: string; search?: string }) =>
    api.get("/projects", { params }),
  getById: (id: string) => api.get(`/projects/${id}`),
  create: (data: Partial<import("@/types").Project>) =>
    api.post("/projects", data),
  update: (id: string, data: Partial<import("@/types").Project>) =>
    api.patch(`/projects/${id}`, data),
  delete: (id: string) => api.delete(`/projects/${id}`),
  stats: () => api.get("/projects/stats"),
};

export default api;