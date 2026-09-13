import { create } from "zustand";

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
  setSession: (user: AuthUser, accessToken: string) => void;
  setAccessToken: (token: string | null) => void;
  clear: () => void;
}

/**
 * Access token lives in memory only (never localStorage) to limit XSS
 * blast radius; the refresh token is an httpOnly cookie the browser
 * attaches automatically. On app boot we call /auth/refresh to silently
 * re-establish a session from that cookie - see api/client.ts.
 */
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  status: "idle",
  setSession: (user, accessToken) => set({ user, accessToken, status: "authenticated" }),
  setAccessToken: (token) => set({ accessToken: token }),
  clear: () => set({ user: null, accessToken: null, status: "unauthenticated" }),
}));
