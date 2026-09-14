import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Flame, Timer, BookOpen, Target, ArrowRight, Smile, Repeat } from "lucide-react-native";
import ScreenContainer from "@/components/ui/ScreenContainer";
import Skeleton from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import ProgressRing from "@/components/ui/ProgressRing";
import HabitCheckItem from "@/features/habits/HabitCheckItem";
import { useCheckIn } from "@/features/habits/hooks";
import { useDashboard } from "@/features/dashboard/hooks";
import HeroBanner from "@/features/dashboard/HeroBanner";
import DailyAiCard from "@/features/dashboard/DailyAiCard";
import { useAppTheme } from "@/hooks/useAppTheme";
import { formatMinutes, todayStr } from "@/utils/date";
import { DashboardData } from "@/types";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const router = useRouter();
  const { data, isLoading } = useDashboard();

  if (isLoading || !data) {
    return (
      <ScreenContainer>
        <ScrollView contentContainerStyle={[styles.container, { paddingTop: insets.top + 16 }]}>
          <Skeleton height={150} radius={20} />
          <Skeleton height={140} radius={18} />
          <Skeleton height={200} radius={18} />
        </ScrollView>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={[styles.container, { paddingTop: insets.top + 16 }]}>
        <HeroBanner message={data.hero.message} date={data.date} streak={data.streaks.longestActive} productivityScore={data.productivity.score} />

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.progressRow}>
            <ProgressRing
              value={data.productivity.score}
              size={100}
              label={
                <>
                  <Text style={[styles.ringValue, { color: colors.text }]}>{data.productivity.score}%</Text>
                  <Text style={[styles.ringLabel, { color: colors.textMuted }]}>Today</Text>
                </>
              }
            />
            <View style={styles.statsGrid}>
              <Stat icon={<Repeat size={13} color={colors.primary} />} value={`${data.productivity.habits.completed}/${data.productivity.habits.scheduled}`} label="Habits done" />
              <Stat icon={<Timer size={13} color={colors.primary} />} value={formatMinutes(data.focusMinutes)} label="Focus time" />
              <Stat icon={<Flame size={13} color={colors.warning} />} value={String(data.streaks.longestActive)} label="Day streak" />
              <Stat icon={<Smile size={13} color={colors.primary} />} value={data.mood ? data.mood.mood : "—"} label="Mood" />
            </View>
          </View>
        </View>

        <Section title="Today's habits" onViewAll={() => router.push("/(tabs)/habits")}>
          {data.habits.length === 0 ? (
            <EmptyState icon={Repeat} title="Your first habit starts here." description="Add a habit to start tracking real progress." />
          ) : (
            <View>
              {data.habits.map((h) => (
                <DashboardHabitRow key={h.habit.id} habit={h} date={data.date} />
              ))}
            </View>
          )}
        </Section>

        <Section title="Today's Top 3" onViewAll={() => router.push("/(tabs)/tasks")}>
          {data.top3.length === 0 ? (
            <EmptyState icon={Target} title="No top priorities set" description="Pick your 3 most important tasks for today." />
          ) : (
            <View style={{ gap: 10 }}>
              {data.top3.map((t, i) => (
                <View key={t._id} style={styles.top3Row}>
                  <Text style={{ color: colors.textMuted, fontWeight: "700", width: 16 }}>{i + 1}.</Text>
                  <Text style={{ color: colors.text, flex: 1, textDecorationLine: t.status === "completed" ? "line-through" : "none" }}>
                    {t.title}
                  </Text>
                  {t.status === "completed" ? (
                    <View style={[styles.doneBadge, { backgroundColor: colors.success + "22" }]}>
                      <Text style={{ color: colors.success, fontSize: 10, fontWeight: "700" }}>Done</Text>
                    </View>
                  ) : null}
                </View>
              ))}
            </View>
          )}
        </Section>

        <Section title="Goals" onViewAll={() => router.push("/(more)/goals")}>
          {data.goals.length === 0 ? (
            <EmptyState icon={Target} title="Give your effort a direction." description="Set a goal to connect your daily habits to something bigger." />
          ) : (
            <View style={{ gap: 14 }}>
              {data.goals.map((g) => {
                const pct = Math.min(100, Math.round((g.currentValue / g.targetValue) * 100));
                return (
                  <View key={g._id}>
                    <View style={styles.goalRow}>
                      <Text style={{ color: colors.text, fontSize: 13 }}>{g.title}</Text>
                      <Text style={{ color: colors.textMuted, fontSize: 12 }}>{pct}%</Text>
                    </View>
                    <View style={[styles.progressTrack, { backgroundColor: colors.surfaceAlt }]}>
                      <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: colors.primary }]} />
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </Section>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <StatusRow
            icon={<BookOpen size={15} color={colors.text} />}
            title="Journal"
            subtitle={data.journalCompleted ? "Completed today" : "Not written yet"}
            actionLabel={data.journalCompleted ? "View" : "Write"}
            onPress={() => router.push("/(more)/journal")}
          />
          <StatusRow
            icon={<Timer size={15} color={colors.text} />}
            title="Focus"
            subtitle={`${formatMinutes(data.focusMinutes)} today`}
            actionLabel="Start"
            onPress={() => router.push("/(tabs)/focus")}
          />
        </View>

        <DailyAiCard />
      </ScrollView>
    </ScreenContainer>
  );
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.statItem}>
      {icon}
      <View>
        <Text style={{ color: colors.text, fontSize: 13, fontWeight: "700" }}>{value}</Text>
        <Text style={{ color: colors.textMuted, fontSize: 10 }}>{label}</Text>
      </View>
    </View>
  );
}

function Section({ title, onViewAll, children }: { title: string; onViewAll: () => void; children: React.ReactNode }) {
  const { colors } = useAppTheme();
  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
        <Pressable style={styles.viewAll} onPress={onViewAll}>
          <Text style={{ color: colors.primary, fontSize: 12, fontWeight: "600" }}>View all</Text>
          <ArrowRight size={12} color={colors.primary} />
        </Pressable>
      </View>
      {children}
    </View>
  );
}

function StatusRow({
  icon,
  title,
  subtitle,
  actionLabel,
  onPress,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  actionLabel: string;
  onPress: () => void;
}) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.statusRow}>
      <View style={[styles.statusIcon, { backgroundColor: colors.surfaceAlt }]}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.text, fontWeight: "700", fontSize: 13 }}>{title}</Text>
        <Text style={{ color: colors.textMuted, fontSize: 12 }}>{subtitle}</Text>
      </View>
      <Pressable style={[styles.smallBtn, { backgroundColor: colors.surfaceAlt }]} onPress={onPress}>
        <Text style={{ color: colors.text, fontSize: 12, fontWeight: "600" }}>{actionLabel}</Text>
      </Pressable>
    </View>
  );
}

function DashboardHabitRow({ habit, date }: { habit: DashboardData["habits"][number]; date: string }) {
  const checkIn = useCheckIn(habit.habit.id);
  const effectiveDate = date || todayStr();

  return (
    <HabitCheckItem
      item={{
        id: habit.habit.id,
        name: habit.habit.name,
        icon: habit.habit.icon,
        color: habit.habit.color,
        type: habit.habit.type,
        priority: habit.habit.priority,
        status: habit.status,
        value: habit.value,
        targetValue: habit.targetValue,
        streak: habit.streak,
      }}
      onComplete={() => checkIn.mutate({ date: effectiveDate, action: "complete" })}
      onUndo={() => checkIn.mutate({ date: effectiveDate, action: "undo" })}
      onSkip={() => checkIn.mutate({ date: effectiveDate, action: "skip" })}
      onMiss={() => checkIn.mutate({ date: effectiveDate, action: "miss" })}
      onIncrement={(delta) => checkIn.mutate({ date: effectiveDate, action: "increment", value: delta })}
    />
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 16, paddingBottom: 40 },
  card: { borderWidth: 1, borderRadius: 16, padding: 16, gap: 10 },
  progressRow: { flexDirection: "row", alignItems: "center", gap: 16 },
  ringValue: { fontSize: 22, fontWeight: "800" },
  ringLabel: { fontSize: 10, fontWeight: "600" },
  statsGrid: { flex: 1, flexDirection: "row", flexWrap: "wrap", gap: 12 },
  statItem: { flexDirection: "row", alignItems: "center", gap: 6, width: "45%" },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sectionTitle: { fontSize: 15, fontWeight: "700" },
  viewAll: { flexDirection: "row", alignItems: "center", gap: 4 },
  top3Row: { flexDirection: "row", alignItems: "center", gap: 8 },
  doneBadge: { paddingVertical: 2, paddingHorizontal: 6, borderRadius: 6 },
  goalRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  progressTrack: { height: 6, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 3 },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  statusIcon: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  smallBtn: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8 },
});
