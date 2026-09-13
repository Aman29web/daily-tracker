import { apiClient } from "../client";
import { AuthUser } from "../../stores/authStore";
import { UserSettings } from "../../types";

export interface AuthResponse {
  user: AuthUser;
  accessToken: string;
}

export const authApi = {
  register: (input: { name: string; email: string; password: string; timezone: string }) =>
    apiClient.post<{ data: AuthResponse }>("/auth/register", input).then((r) => r.data.data),

  login: (input: { email: string; password: string }) =>
    apiClient.post<{ data: AuthResponse }>("/auth/login", input).then((r) => r.data.data),

  logout: () => apiClient.post("/auth/logout"),

  me: () =>
    apiClient.get<{ data: { user: AuthUser; settings: UserSettings } }>("/auth/me").then((r) => r.data.data),

  updateProfile: (input: Partial<Pick<AuthUser, "name" | "timezone" | "avatarColor">>) =>
    apiClient.patch<{ data: { user: AuthUser } }>("/auth/me", input).then((r) => r.data.data.user),

  changePassword: (input: { currentPassword: string; newPassword: string }) =>
    apiClient.post<{ data: { accessToken: string } }>("/auth/change-password", input).then((r) => r.data.data),

  forgotPassword: (email: string) => apiClient.post("/auth/forgot-password", { email }),

  resetPassword: (input: { token: string; newPassword: string }) => apiClient.post("/auth/reset-password", input),
};
