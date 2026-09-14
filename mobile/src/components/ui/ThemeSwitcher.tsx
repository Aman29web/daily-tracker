import { View, Pressable, StyleSheet } from "react-native";
import { Sun, Moon, Monitor } from "lucide-react-native";
import { useThemeStore, ThemePreference } from "@/stores/themeStore";
import { useAppTheme } from "@/hooks/useAppTheme";

const OPTIONS: { value: ThemePreference; Icon: typeof Sun }[] = [
  { value: "light", Icon: Sun },
  { value: "dark", Icon: Moon },
  { value: "system", Icon: Monitor },
];

export default function ThemeSwitcher() {
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);
  const { colors } = useAppTheme();

  return (
    <View style={[styles.row, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
      {OPTIONS.map(({ value, Icon }) => {
        const active = theme === value;
        return (
          <Pressable
            key={value}
            onPress={() => setTheme(value)}
            style={[styles.btn, active && { backgroundColor: colors.primary }]}
          >
            <Icon size={16} color={active ? colors.primaryText : colors.textMuted} />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", borderRadius: 10, borderWidth: 1, padding: 3, gap: 3 },
  btn: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8 },
});
