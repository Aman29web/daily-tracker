import { View, Text, StyleSheet } from "react-native";
import { useAppTheme } from "@/hooks/useAppTheme";

export default function SplashScreen() {
  const { colors } = useAppTheme();
  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <Text style={[styles.mark, { color: colors.primary }]}>Momentum</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center" },
  mark: { fontSize: 22, fontWeight: "700", letterSpacing: 0.5 },
});
