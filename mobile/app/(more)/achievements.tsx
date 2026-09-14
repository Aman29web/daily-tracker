import { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Lock } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { achievementsApi } from "@/api/endpoints/insights";
import DynamicIcon from "@/components/ui/DynamicIcon";
import ConfettiBurst from "@/components/ui/ConfettiBurst";
import Skeleton from "@/components/ui/Skeleton";
import ScreenContainer from "@/components/ui/ScreenContainer";
import { useAppTheme } from "@/hooks/useAppTheme";

const SEEN_KEY = "momentum.seenAchievements";

export default function AchievementsScreen() {
  const { colors } = useAppTheme();
  const { data, isLoading } = useQuery({ queryKey: ["achievements"], queryFn: achievementsApi.list });
  const [seenIds, setSeenIds] = useState<Set<string> | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(SEEN_KEY)
      .then((raw) => setSeenIds(new Set(raw ? JSON.parse(raw) : [])))
      .catch(() => setSeenIds(new Set()));
  }, []);

  useEffect(() => {
    if (!data || !seenIds) return;
    const newlyUnlocked = data.filter((a) => a.unlocked && !seenIds.has(a.achievement.key));
    if (newlyUnlocked.length === 0) return;
    const next = new Set(seenIds);
    newlyUnlocked.forEach((a) => next.add(a.achievement.key));
    setSeenIds(next);
    void AsyncStorage.setItem(SEEN_KEY, JSON.stringify([...next]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const unlockedCount = data?.filter((a) => a.unlocked).length ?? 0;

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={{ color: colors.textMuted, fontSize: 13 }}>
          {unlockedCount} of {data?.length ?? 0} unlocked
        </Text>

        <View style={styles.grid}>
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} height={130} width="47%" radius={18} />)
            : data?.map((item) => {
                const justUnlocked =
                  item.unlocked && item.unlockedAt && Date.now() - new Date(item.unlockedAt).getTime() < 86_400_000 && seenIds && !seenIds.has(item.achievement.key);
                const pct = Math.round((item.progress / item.threshold) * 100);
                return (
                  <View
                    key={item.achievement.key}
                    style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, opacity: item.unlocked ? 1 : 0.85 }]}
                  >
                    {justUnlocked ? <ConfettiBurst /> : null}
                    <View style={[styles.iconWrap, { backgroundColor: colors.surfaceAlt, opacity: item.unlocked ? 1 : 0.5 }]}>
                      {item.unlocked ? <DynamicIcon name={item.achievement.icon} size={20} color={colors.primary} /> : <Lock size={16} color={colors.textMuted} />}
                    </View>
                    <Text style={{ color: colors.text, fontWeight: "700", fontSize: 13 }}>{item.achievement.title}</Text>
                    <Text style={{ color: colors.textMuted, fontSize: 11 }} numberOfLines={2}>
                      {item.achievement.description}
                    </Text>
                    {!item.unlocked ? (
                      <View style={{ gap: 4, marginTop: 4 }}>
                        <View style={[styles.progressTrack, { backgroundColor: colors.surfaceAlt }]}>
                          <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: colors.primary }]} />
                        </View>
                        <Text style={{ color: colors.textMuted, fontSize: 10 }}>
                          {item.progress}/{item.threshold}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                );
              })}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 16, paddingBottom: 40 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  card: { width: "47%", borderWidth: 1, borderRadius: 16, padding: 14, gap: 6, overflow: "hidden" },
  iconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  progressTrack: { height: 5, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 3 },
});
