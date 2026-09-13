import { useEffect, useState } from "react";
import { authApi } from "../api/endpoints/auth";
import { refreshAccessToken } from "../api/client";
import { useAuthStore } from "../stores/authStore";

/** Silently re-establishes a session from the httpOnly refresh cookie on app load. */
export function useAuthBootstrap() {
  const [ready, setReady] = useState(false);
  const setSession = useAuthStore((s) => s.setSession);
  const clear = useAuthStore((s) => s.clear);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const token = await refreshAccessToken();
      if (cancelled) return;
      if (!token) {
        clear();
        setReady(true);
        return;
      }
      try {
        const { user } = await authApi.me();
        if (!cancelled) setSession(user, token);
      } catch {
        if (!cancelled) clear();
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return ready;
}
