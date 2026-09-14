import { View, Text, Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useToastStore } from "@/stores/toastStore";
import { useAppTheme } from "@/hooks/useAppTheme";

export default function ToastHost() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();

  if (toasts.length === 0) return null;

  return (
    <View pointerEvents="box-none" style={[styles.wrap, { top: insets.top + 8 }]}>
      {toasts.map((t) => (
        <Pressable
          key={t.id}
          onPress={() => dismiss(t.id)}
          style={[
            styles.toast,
            { backgroundColor: t.type === "error" ? colors.danger : colors.success },
          ]}
        >
          <Text style={styles.text}>{t.message}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: "absolute", left: 16, right: 16, gap: 8, zIndex: 100 },
  toast: { borderRadius: 10, paddingVertical: 10, paddingHorizontal: 14 },
  text: { color: "#fff", fontWeight: "600", fontSize: 13 },
});
