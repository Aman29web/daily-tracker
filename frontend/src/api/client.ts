import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "../stores/authStore";

/**
 * Defaults to the relative "/api", which only resolves correctly in local
 * dev via Vite's dev-server proxy (see vite.config.ts) or in a deployment
 * where the frontend and backend share one origin. Once they're on
 * different domains (e.g. Vercel + Render), VITE_API_URL must be set at
 * build time to the backend's full ".../api" URL - Vite inlines env vars
 * into the static bundle, so this cannot be changed after the build.
 */
const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // send the httpOnly refresh cookie
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  try {
    const res = await axios.post(
      `${API_BASE_URL}/auth/refresh`,
      {},
      { withCredentials: true }
    );
    const token = res.data?.data?.accessToken ?? null;
    useAuthStore.getState().setAccessToken(token);
    return token;
  } catch {
    useAuthStore.getState().clear();
    return null;
  }
}

apiClient.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    const status = error.response?.status;
    const errorCode = (error.response?.data as { errorCode?: string } | undefined)?.errorCode;

    const isAuthRoute = original?.url?.includes("/auth/login") || original?.url?.includes("/auth/register");

    if (status === 401 && original && !original._retry && !isAuthRoute && errorCode !== "INVALID_CREDENTIALS") {
      original._retry = true;
      if (!refreshPromise) refreshPromise = refreshAccessToken().finally(() => (refreshPromise = null));
      const token = await refreshPromise;
      if (token) {
        original.headers = original.headers ?? {};
        original.headers.Authorization = `Bearer ${token}`;
        return apiClient(original);
      }
    }

    return Promise.reject(error);
  }
);

export interface ApiSuccess<T> {
  success: true;
  message: string;
  data: T;
  meta?: Record<string, unknown>;
}

export interface ApiFailure {
  success: false;
  message: string;
  errorCode: string;
  details?: unknown;
}

export function extractErrorMessage(error: unknown, fallback = "Something went wrong"): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiFailure | undefined;
    return data?.message ?? fallback;
  }
  return fallback;
}

export { refreshAccessToken };
