import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type ThemePreference = "light" | "dark" | "system";

interface ThemeState {
  theme: ThemePreference;
  hydrated: boolean;
  setTheme: (theme: ThemePreference) => void;
  hydrate: () => Promise<void>;
}

const STORAGE_KEY = "momentum.theme";

export const useThemeStore = create<ThemeState>((set) => ({
  theme: "system",
  hydrated: false,
  hydrate: async () => {
    try {
      const stored = (await AsyncStorage.getItem(STORAGE_KEY)) as ThemePreference | null;
      if (stored === "light" || stored === "dark" || stored === "system") {
        set({ theme: stored, hydrated: true });
        return;
      }
    } catch {
      // ignore
    }
    set({ hydrated: true });
  },
  setTheme: (theme) => {
    void AsyncStorage.setItem(STORAGE_KEY, theme).catch(() => {});
    set({ theme });
  },
}));
