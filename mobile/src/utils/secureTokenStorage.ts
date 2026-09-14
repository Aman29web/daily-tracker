import * as SecureStore from "expo-secure-store";

/**
 * Web keeps the refresh token in an httpOnly cookie the browser attaches
 * automatically (see frontend/src/api/client.ts). Mobile has no cookie jar,
 * so the refresh token is persisted here instead and sent explicitly on
 * POST /auth/refresh - this is the one piece of the auth flow that can't
 * port as-is from web (see backend README's "Future React Native
 * integration" section).
 */
const REFRESH_TOKEN_KEY = "momentum.refreshToken";

export async function getRefreshToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function setRefreshToken(token: string | null): Promise<void> {
  try {
    if (token) await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
    else await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  } catch {
    // ignore - worst case the user is asked to log in again
  }
}
