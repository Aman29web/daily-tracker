import { View, Text, TextInput, TextInputProps, StyleSheet } from "react-native";
import { useAppTheme } from "@/hooks/useAppTheme";

interface Props extends TextInputProps {
  label?: string;
  error?: string;
}

export default function TextField({ label, error, style, ...rest }: Props) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.wrap}>
      {label ? <Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={colors.textMuted}
        style={[
          styles.input,
          { backgroundColor: colors.surfaceAlt, borderColor: error ? colors.danger : colors.border, color: colors.text },
          style,
        ]}
        {...rest}
      />
      {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  label: { fontSize: 13, fontWeight: "600" },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  error: { fontSize: 12 },
});
