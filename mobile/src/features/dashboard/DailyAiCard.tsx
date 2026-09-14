import { View, Text, Pressable, StyleSheet } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Sparkles, ArrowRight } from "lucide-react-native";
import { aiApi } from "@/api/endpoints/insights";
import { useAppTheme } from "@/hooks/useAppTheme";

export default function DailyAiCard() {
  const { colors } = useAppTheme();
  const router = useRouter();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["ai-daily-analysis"],
    queryFn: () => aiApi.dailyAnalysis(),
    staleTime: 10 * 60_000,
    retry: false,
  });

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.header}>
        <View style={[styles.iconWrap, { backgroundColor: colors.primary + "22" }]}>
          <Sparkles size={13} color={colors.primary} />
        </View>
        <Text style={[styles.title, { color: colors.text }]}>AI take on today</Text>
      </View>

      {isLoading ? <Text style={{ color: colors.textMuted, fontSize: 13 }}>Thinking…</Text> : null}
      {isError ? <Text style={{ color: colors.textMuted, fontSize: 13 }}>Couldn't reach the AI provider right now.</Text> : null}
      {data ? <Text style={{ color: colors.text, fontSize: 13, lineHeight: 19 }}>{data}</Text> : null}

      <Pressable style={styles.link} onPress={() => router.push("/(more)/analytics")}>
        <Text style={{ color: colors.primary, fontSize: 12, fontWeight: "700" }}>Ask the AI assistant more</Text>
        <ArrowRight size={12} color={colors.primary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 16, padding: 16, gap: 10 },
  header: { flexDirection: "row", alignItems: "center", gap: 8 },
  iconWrap: { width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 14, fontWeight: "700" },
  link: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
});
