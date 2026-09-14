import { View, Text, ScrollView, StyleSheet } from "react-native";
import { BookOpen, Timer, CheckSquare } from "lucide-react-native";
import BottomSheet from "@/components/ui/BottomSheet";
import DynamicIcon from "@/components/ui/DynamicIcon";
import Skeleton from "@/components/ui/Skeleton";
import { useCalendarDay } from "./hooks";
import { formatMinutes, formatPretty } from "@/utils/date";
import { useAppTheme } from "@/hooks/useAppTheme";

const MOOD_EMOJI: Record<string, string> = {
  great: "😄",
  good: "🙂",
  okay: "😐",
  bad: "😞",
  terrible: "😔",
};

function statusColor(status: string, colors: ReturnType<typeof useAppTheme>["colors"]): string {
  if (status === "completed") return colors.success;
  if (status === "missed" || status === "skipped") return colors.danger;
  if (status === "paused") return colors.primary;
  return colors.textMuted;
}

export default function DayDetailSheet({ date, onClose }: { date: string | null; onClose: () => void }) {
  const { colors } = useAppTheme();
  const { data, isLoading } = useCalendarDay(date);

  return (
    <BottomSheet visible={!!date} onClose={onClose}>
      {date ? (
        <ScrollView contentContainerStyle={{ paddingBottom: 12 }}>
          <Text style={[styles.title, { color: colors.text }]}>{formatPretty(date)}</Text>

          {isLoading || !data ? (
            <View style={{ gap: 10, marginTop: 10 }}>
              <Skeleton height={60} radius={12} />
              <Skeleton height={100} radius={12} />
            </View>
          ) : (
            <View style={{ gap: 16, marginTop: 10 }}>
              <View style={styles.scoreRow}>
                <Text style={[styles.score, { color: colors.text }]}>{data.summary.productivityScore}%</Text>
                <Text style={{ color: colors.textMuted, fontSize: 12 }}>Productivity score</Text>
              </View>

              <View style={styles.statsRow}>
                <StatChip icon={<CheckSquare size={13} color={colors.textMuted} />} label={`${data.summary.habitsCompleted}/${data.summary.habitsScheduled} habits`} />
                <StatChip icon={<Timer size={13} color={colors.textMuted} />} label={`${formatMinutes(data.summary.focusMinutes)} focus`} />
                <StatChip icon={<BookOpen size={13} color={colors.textMuted} />} label={data.journal ? "Journaled" : "No entry"} />
                {data.mood ? <StatChip label={`${MOOD_EMOJI[data.mood.mood] ?? "🙂"} ${data.mood.mood}`} /> : null}
              </View>

              {data.habits.length > 0 ? (
                <View style={{ gap: 8 }}>
                  <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Habits</Text>
                  {data.habits.map((h) => (
                    <View key={h.id} style={styles.habitRow}>
                      <View style={[styles.habitIcon, { backgroundColor: h.color + "22" }]}>
                        <DynamicIcon name={h.icon} size={13} color={h.color} />
                      </View>
                      <Text style={{ color: colors.text, flex: 1, fontSize: 13 }}>{h.name}</Text>
                      <Text style={{ color: statusColor(h.status, colors), fontSize: 11, fontWeight: "700", textTransform: "capitalize" }}>
                        {h.status.replace("_", " ")}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : null}

              {data.tasks.length > 0 ? (
                <View style={{ gap: 8 }}>
                  <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Tasks due</Text>
                  {data.tasks.map((t) => (
                    <View key={t._id} style={styles.taskRow}>
                      <Text style={{ color: colors.text, flex: 1, fontSize: 13 }}>{t.title}</Text>
                      <Text style={{ color: t.status === "completed" ? colors.success : colors.textMuted, fontSize: 11, fontWeight: "700" }}>{t.status}</Text>
                    </View>
                  ))}
                </View>
              ) : null}

              {data.journal?.wentWell ? (
                <View style={{ gap: 6 }}>
                  <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Journal</Text>
                  <Text style={{ color: colors.text, fontStyle: "italic", fontSize: 13 }}>"{data.journal.wentWell}"</Text>
                </View>
              ) : null}
            </View>
          )}
        </ScrollView>
      ) : null}
    </BottomSheet>
  );
}

function StatChip({ icon, label }: { icon?: React.ReactNode; label: string }) {
  const { colors } = useAppTheme();
  return (
    <View style={[styles.chip, { backgroundColor: colors.surfaceAlt }]}>
      {icon}
      <Text style={{ color: colors.text, fontSize: 11 }}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 17, fontWeight: "800" },
  scoreRow: { gap: 2 },
  score: { fontSize: 28, fontWeight: "800" },
  statsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { flexDirection: "row", alignItems: "center", gap: 5, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8 },
  sectionTitle: { fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.4 },
  habitRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  habitIcon: { width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  taskRow: { flexDirection: "row", alignItems: "center", gap: 8 },
});
