import { Pressable, Text, StyleSheet, ActivityIndicator, PressableProps } from "react-native";
import { useAppTheme } from "@/hooks/useAppTheme";

interface Props extends Omit<PressableProps, "style"> {
  label: string;
  variant?: "primary" | "secondary" | "danger";
  loading?: boolean;
}

export default function Button({ label, variant = "primary", loading, disabled, ...rest }: Props) {
  const { colors } = useAppTheme();

  const bg = variant === "primary" ? colors.primary : variant === "danger" ? colors.danger : colors.surfaceAlt;
  const fg = variant === "secondary" ? colors.text : colors.primaryText;

  return (
    <Pressable
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: bg, opacity: pressed || disabled || loading ? 0.7 : 1 },
      ]}
      {...rest}
    >
      {loading ? <ActivityIndicator color={fg} /> : <Text style={[styles.label, { color: fg }]}>{label}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: { borderRadius: 12, paddingVertical: 14, alignItems: "center", justifyContent: "center" },
  label: { fontSize: 15, fontWeight: "700" },
});
