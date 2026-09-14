import { View, Text, ScrollView, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Timer as TimerIcon } from "lucide-react-native";
import ScreenContainer from "@/components/ui/ScreenContainer";
import EmptyState from "@/components/ui/EmptyState";
import { useActiveFocusSession, useFocusSessions } from "@/features/focus/hooks";
import StartSessionForm from "@/features/focus/StartSessionForm";
import ActiveSessionRing from "@/features/focus/ActiveSessionRing";
import { useAppTheme } from "@/hooks/useAppTheme";
import { formatMinutes, todayStr } from "@/utils/date";

export default function FocusScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { data: active, isLoading } = useActiveFocusSession();
  const { data: todaysSessions } = useFocusSessions({ start: todayStr(), end: todayStr(), limit: 20 });

  const todayMinutes = (todaysSessions ?? []).filter((s) => s.status === "completed").reduce((sum, s) => sum + s.actualDuration, 0);

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <View>
            <Text style={[styles.title, { color: colors.text }]}>Focus</Text>
            <Text style={{ color: colors.textMuted }}>Deep work, timed.</Text>
          </View>
          <View style={[styles.totalPill, { backgroundColor: colors.surfaceAlt }]}>
            <TimerIcon size={13} color={colors.textMuted} />
            <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: "600" }}>{formatMinutes(todayMinutes)} today</Text>
          </View>
        </View>

        <View style={[styles.mainCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {isLoading ? null : active ? <ActiveSessionRing session={active} /> : <StartSessionForm />}
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Today's sessions</Text>
          {!todaysSessions?.length ? (
            <EmptyState icon={TimerIcon} title="No sessions yet" description="Start a focus session above to begin tracking deep work." />
          ) : (
            <View style={{ gap: 10 }}>
              {todaysSessions.map((s) => (
                <View key={s._id} style={styles.sessionRow}>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor:
                          (s.status === "completed" ? colors.success : s.status === "cancelled" ? colors.danger : colors.textMuted) + "22",
                      },
                    ]}
                  >
                    <Text
                      style={{
                        fontSize: 10,
                        fontWeight: "700",
                        color: s.status === "completed" ? colors.success : s.status === "cancelled" ? colors.danger : colors.textMuted,
                        textTransform: "capitalize",
                      }}
                    >
                      {s.status}
                    </Text>
                  </View>
                  <Text style={{ color: colors.text, flex: 1 }}>{s.category}</Text>
                  <Text style={{ color: colors.textMuted }}>{formatMinutes(s.actualDuration)}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 16, paddingBottom: 40 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  title: { fontSize: 26, fontWeight: "800" },
  totalPill: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 20 },
  mainCard: { borderWidth: 1, borderRadius: 18, padding: 20, alignItems: "center" },
  section: { borderWidth: 1, borderRadius: 16, padding: 16, gap: 10 },
  sectionTitle: { fontSize: 15, fontWeight: "700" },
  sessionRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  statusBadge: { paddingVertical: 3, paddingHorizontal: 8, borderRadius: 6 },
});
