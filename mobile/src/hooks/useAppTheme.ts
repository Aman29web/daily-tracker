import { useColorScheme as useSystemColorScheme } from "react-native";
import { useThemeStore } from "@/stores/themeStore";
import { lightColors, darkColors, AppColors } from "@/styles/colors";

export function useAppTheme(): { scheme: "light" | "dark"; colors: AppColors } {
  const preference = useThemeStore((s) => s.theme);
  const system = useSystemColorScheme();
  const scheme = preference === "system" ? (system === "dark" ? "dark" : "light") : preference;
  return { scheme, colors: scheme === "dark" ? darkColors : lightColors };
}
