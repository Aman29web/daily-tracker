import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "@/stores/authStore";
import { getRefreshToken, setRefreshToken } from "@/utils/secureTokenStorage";
import { API_BASE_URL } from "@/utils/env";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshPromise: Promise<string | null> | null = null;

/**
 * Mirrors frontend/src/api/client.ts's refresh flow, with the token source
 * swapped from an httpOnly cookie to the refresh token held in SecureStore
 * (mobile has no cookie jar) - sent explicitly in the request body instead.
 */
async function refreshAccessToken(): Promise<string | null> {
  try {
    const refreshToken = await getRefreshToken();
    if (!refreshToken) throw new Error("No refresh token");

    const res = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
    const newAccessToken = res.data?.data?.accessToken ?? null;
    const newRefreshToken = res.data?.data?.refreshToken ?? null;

    useAuthStore.getState().setAccessToken(newAccessToken);
    if (newRefreshToken) await setRefreshToken(newRefreshToken);

    return newAccessToken;
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
