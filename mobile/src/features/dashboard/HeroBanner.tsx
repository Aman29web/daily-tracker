import { View, Text, StyleSheet } from "react-native";
import { useAuthStore } from "@/stores/authStore";
import { formatPretty } from "@/utils/date";
import { useAppTheme } from "@/hooks/useAppTheme";

interface Props {
  message: string;
  date: string;
  streak: number;
  productivityScore: number;
}

export default function HeroBanner({ message, date, streak, productivityScore }: Props) {
  const { colors } = useAppTheme();
  const user = useAuthStore((s) => s.user);
  const firstName = user?.name.split(" ")[0];

  return (
    <View style={[styles.card, { backgroundColor: colors.primary }]}>
      <Text style={styles.date}>{formatPretty(date)}</Text>
      <Text style={styles.message}>
        {firstName ? `${firstName}, ` : ""}
        {message}
      </Text>
      <View style={styles.statsRow}>
        <View>
          <Text style={styles.statValue}>{productivityScore}%</Text>
          <Text style={styles.statLabel}>Today's score</Text>
        </View>
        <View style={styles.divider} />
        <View>
          <Text style={styles.statValue}>🔥 {streak}</Text>
          <Text style={styles.statLabel}>Day streak</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 20, padding: 20, gap: 12 },
  date: { color: "rgba(255,255,255,0.8)", fontSize: 12, fontWeight: "600" },
  message: { color: "#fff", fontSize: 20, fontWeight: "800" },
  statsRow: { flexDirection: "row", alignItems: "center", gap: 16, marginTop: 4 },
  divider: { width: 1, height: 28, backgroundColor: "rgba(255,255,255,0.3)" },
  statValue: { color: "#fff", fontSize: 18, fontWeight: "800" },
  statLabel: { color: "rgba(255,255,255,0.8)", fontSize: 11 },
});
