import { useEffect, useState } from "react";
import { useAuthStore } from "@/stores/authStore";
import { authApi } from "@/api/endpoints/auth";
import { refreshAccessToken } from "@/api/client";
import { getRefreshToken } from "@/utils/secureTokenStorage";

/**
 * Web silently restores a session on boot because the browser attaches the
 * httpOnly refresh cookie automatically (see frontend's App.tsx +
 * api/client.ts). Mobile has no cookie jar, so this explicitly reads the
 * refresh token from SecureStore, exchanges it for a fresh access token,
 * then fetches the user profile to repopulate the in-memory auth store -
 * this whole step doesn't exist on web.
 */
export function useAuthBootstrap() {
  const [booting, setBooting] = useState(true);
  const hydrateSession = useAuthStore((s) => s.hydrateSession);
  const clear = useAuthStore((s) => s.clear);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      const stored = await getRefreshToken();
      if (!stored) {
        if (!cancelled) {
          clear();
          setBooting(false);
        }
        return;
      }

      const accessToken = await refreshAccessToken();
      if (!accessToken) {
        if (!cancelled) setBooting(false);
        return;
      }

      try {
        const { user } = await authApi.me();
        if (!cancelled) hydrateSession(user, accessToken);
      } catch {
        if (!cancelled) clear();
      } finally {
        if (!cancelled) setBooting(false);
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return booting;
}
