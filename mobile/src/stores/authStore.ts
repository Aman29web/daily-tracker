import { create } from "zustand";
import { setRefreshToken } from "@/utils/secureTokenStorage";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  timezone: string;
  avatarColor: string;
  createdAt: string;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  status: "idle" | "authenticated" | "unauthenticated";
  /** Persists refreshToken to SecureStore as a side effect - the mobile equivalent of web's httpOnly cookie. */
  setSession: (user: AuthUser, accessToken: string, refreshToken: string | null) => void;
  /** Populates user+accessToken without touching SecureStore - used on cold-start bootstrap, where the refresh token is already there. */
  hydrateSession: (user: AuthUser, accessToken: string) => void;
  setAccessToken: (token: string | null) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  status: "idle",
  setSession: (user, accessToken, refreshToken) => {
    void setRefreshToken(refreshToken);
    set({ user, accessToken, status: "authenticated" });
  },
  hydrateSession: (user, accessToken) => set({ user, accessToken, status: "authenticated" }),
  setAccessToken: (token) => set({ accessToken: token }),
  clear: () => {
    void setRefreshToken(null);
    set({ user: null, accessToken: null, status: "unauthenticated" });
  },
}));
