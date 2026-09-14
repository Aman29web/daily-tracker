import { useState } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { Lightbulb, Trophy, Flame, Clock, Sparkles } from "lucide-react-native";
import { useInsights, useMonthlyReport, useProductivityProfile, useWeeklyReport } from "@/features/analytics/hooks";
import ProductivityChart from "@/features/analytics/ProductivityChart";
import AIPanel from "@/features/analytics/AIPanel";
import Skeleton from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import ChipGroup from "@/components/ui/ChipGroup";
import ScreenContainer from "@/components/ui/ScreenContainer";
import { formatMinutes, formatShort } from "@/utils/date";
import { useAppTheme } from "@/hooks/useAppTheme";

export default function AnalyticsScreen() {
  const { colors } = useAppTheme();
  const [range, setRange] = useState<"week" | "month">("week");
  const weekly = useWeeklyReport();
  const monthly = useMonthlyReport();
  const insights = useInsights();
  const profile = useProductivityProfile();

  const report = range === "week" ? weekly.data : monthly.data;

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.container}>
        <View>
          <Text style={{ color: colors.textMuted, fontSize: 13, marginBottom: 10 }}>Are you becoming better than you were last week?</Text>
          <ChipGroup
            value={range}
            onChange={setRange}
            options={[
              { value: "week", label: "This week" },
              { value: "month", label: "This month" },
            ]}
          />
        </View>

        {!report ? (
          <Skeleton height={300} radius={18} />
        ) : (
          <>
            <View style={styles.summaryGrid}>
              <SummaryStat label="Productivity" value={`${report.productivityAvg}%`} />
              <SummaryStat label="Habit completion" value={`${report.habitsCompletionAvg}%`} />
              <SummaryStat label="Focus time" value={formatMinutes(report.focusMinutesTotal)} />
              <SummaryStat label="Journal days" value={`${report.journalDays}/${report.totalDays}`} />
            </View>

            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Productivity trend</Text>
              <ProductivityChart data={report.dailyScores.map((d) => ({ date: formatShort(d.date), score: d.score }))} />
            </View>

            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Highlights</Text>
              <View style={{ gap: 12 }}>
                {report.topHabit ? (
                  <HighlightRow icon={<Trophy size={15} color={colors.primary} />} label="Most consistent habit" value={`${report.topHabit.name} (${report.topHabit.completionRate}%)`} />
                ) : null}
                {report.mostMissedHabit ? (
                  <HighlightRow icon={<Flame size={15} color={colors.warning} />} label="Most missed habit" value={`${report.mostMissedHabit.name} (${report.mostMissedHabit.missRate}% missed)`} />
                ) : null}
                {report.bestDay ? (
                  <HighlightRow icon={<Sparkles size={15} color={colors.success} />} label="Best day" value={`${formatShort(report.bestDay.date)} (${report.bestDay.score}%)`} />
                ) : null}
                {report.worstDay ? (
                  <HighlightRow icon={<Clock size={15} color={colors.danger} />} label="Toughest day" value={`${formatShort(report.worstDay.date)} (${report.worstDay.score}%)`} />
                ) : null}
              </View>
            </View>

            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Insights</Text>
              {insights.isLoading ? <Skeleton height={60} radius={12} /> : null}
              {!insights.isLoading && !insights.data?.length ? (
                <EmptyState icon={Lightbulb} title="Not enough data yet" description="Keep logging — insights appear once there's enough history to trust." />
              ) : null}
              <View style={{ gap: 10 }}>
                {insights.data?.map((insight, idx) => (
                  <View key={idx} style={styles.insightRow}>
                    <Lightbulb size={14} color={colors.warning} />
                    <Text style={{ color: colors.text, fontSize: 13, flex: 1 }}>{insight.text}</Text>
                  </View>
                ))}
              </View>
            </View>

            {profile.data ? (
              <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Your productivity profile</Text>
                <View style={styles.profileGrid}>
                  <ProfileStat label="Best time" value={profile.data.bestProductivityTime ?? "Not enough data"} />
                  <ProfileStat label="Best day" value={profile.data.bestDayOfWeek ?? "Not enough data"} />
                  <ProfileStat label="Strongest habit" value={profile.data.strongestHabit ?? "—"} />
                  <ProfileStat label="Weakest habit" value={profile.data.weakestHabit ?? "—"} />
                  <ProfileStat label="Avg focus / day" value={formatMinutes(profile.data.avgFocusMinutesPerDay)} />
                  <ProfileStat label="Longest streak ever" value={String(profile.data.longestStreakEver)} />
                </View>
              </View>
            ) : null}

            <AIPanel />
          </>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  const { colors } = useAppTheme();
  return (
    <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={{ color: colors.text, fontWeight: "800", fontSize: 16 }}>{value}</Text>
      <Text style={{ color: colors.textMuted, fontSize: 11 }}>{label}</Text>
    </View>
  );
}

function HighlightRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.highlightRow}>
      {icon}
      <View>
        <Text style={{ color: colors.textMuted, fontSize: 11 }}>{label}</Text>
        <Text style={{ color: colors.text, fontSize: 13, fontWeight: "700" }}>{value}</Text>
      </View>
    </View>
  );
}

function ProfileStat({ label, value }: { label: string; value: string }) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.profileStat}>
      <Text style={{ color: colors.text, fontWeight: "700", fontSize: 13 }}>{value}</Text>
      <Text style={{ color: colors.textMuted, fontSize: 11 }}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 16, paddingBottom: 40 },
  summaryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  summaryCard: { flexGrow: 1, minWidth: "45%", borderWidth: 1, borderRadius: 14, padding: 14, gap: 4 },
  card: { borderWidth: 1, borderRadius: 16, padding: 16, gap: 12 },
  sectionTitle: { fontSize: 15, fontWeight: "700" },
  insightRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  highlightRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  profileGrid: { flexDirection: "row", flexWrap: "wrap", gap: 14 },
  profileStat: { width: "45%", gap: 2 },
});
