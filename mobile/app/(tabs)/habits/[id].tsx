import { useState } from "react";
import { View, Text, Pressable, TextInput, ScrollView, Alert, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Flame, Trophy, Palmtree, Pencil, Trash2 } from "lucide-react-native";
import { useHabit, useCheckIn, useDeleteHabit, useUpdateHabitSchedule } from "@/features/habits/hooks";
import { usePauses, useCreatePause, useDeletePause, useEndPauseNow } from "@/features/plans/hooks";
import DynamicIcon from "@/components/ui/DynamicIcon";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import TextField from "@/components/ui/TextField";
import Skeleton from "@/components/ui/Skeleton";
import HabitCheckItem from "@/features/habits/HabitCheckItem";
import HabitHistoryStrip from "@/features/habits/HabitHistoryStrip";
import ScheduleEditor from "@/features/habits/ScheduleEditor";
import ScreenContainer from "@/components/ui/ScreenContainer";
import { describeSchedule } from "@/utils/scheduleLabel";
import { todayStr } from "@/utils/date";
import { toast } from "@/stores/toastStore";
import { useAppTheme } from "@/hooks/useAppTheme";
import { HabitSchedule } from "@/types";

export default function HabitDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useAppTheme();
  const { data, isLoading } = useHabit(id);
  const checkIn = useCheckIn(id!);
  const deleteHabit = useDeleteHabit();
  const [scheduleEditOpen, setScheduleEditOpen] = useState(false);
  const [pauseModalOpen, setPauseModalOpen] = useState(false);

  if (isLoading || !data) {
    return (
      <ScreenContainer style={styles.loadingPad}>
        <Skeleton height={40} width="40%" />
        <Skeleton height={140} radius={18} style={{ marginTop: 16 }} />
        <Skeleton height={140} radius={18} style={{ marginTop: 16 }} />
      </ScreenContainer>
    );
  }

  const { habit, today, streak } = data;
  const today_ = todayStr();

  const confirmDelete = () => {
    Alert.alert("Delete habit", `Delete "${habit.name}"? Historical check-ins are kept.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deleteHabit.mutate(habit._id, { onSuccess: () => router.back() }),
      },
    ]);
  };

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <View style={[styles.iconWrap, { backgroundColor: habit.color + "22" }]}>
            <DynamicIcon name={habit.icon} size={22} color={habit.color} />
          </View>
          <View style={styles.headerInfo}>
            <Text style={[styles.name, { color: colors.text }]}>{habit.name}</Text>
            {habit.description ? <Text style={{ color: colors.textMuted }}>{habit.description}</Text> : null}
            <View style={styles.badges}>
              <Badge label={habit.category} colors={colors} />
              <Badge label={`${habit.priority} priority`} colors={colors} tone="primary" />
              {!habit.isActive ? <Badge label="Inactive" colors={colors} tone="danger" /> : null}
            </View>
          </View>
          <Pressable onPress={confirmDelete} hitSlop={8}>
            <Trash2 size={18} color={colors.danger} />
          </Pressable>
        </View>

        <View style={styles.statsRow}>
          <StatCard icon={<Flame size={18} color={colors.warning} />} value={streak.current} label="Current streak" colors={colors} />
          <StatCard icon={<Trophy size={18} color={colors.primary} />} value={streak.longest} label="Longest streak" colors={colors} />
          <StatCard
            icon={<Palmtree size={18} color="#60A5FA" />}
            value={today.status.replace("_", " ")}
            label="Today"
            colors={colors}
          />
        </View>

        <Section title="Check in" colors={colors}>
          <HabitCheckItem
            item={{
              id: habit._id,
              name: habit.name,
              icon: habit.icon,
              color: habit.color,
              type: habit.type,
              priority: habit.priority,
              status: today.status,
              value: today.value,
              targetValue: today.targetValue,
              unit: habit.target?.unit,
              streak: streak.current,
            }}
            onComplete={() => checkIn.mutate({ date: today_, action: "complete" })}
            onUndo={() => checkIn.mutate({ date: today_, action: "undo" })}
            onSkip={() => checkIn.mutate({ date: today_, action: "skip" })}
            onMiss={() => checkIn.mutate({ date: today_, action: "miss" })}
            onIncrement={(delta) => checkIn.mutate({ date: today_, action: "increment", value: delta })}
          />
        </Section>

        <Section
          title="Schedule"
          colors={colors}
          action={
            <Pressable onPress={() => setScheduleEditOpen(true)} style={styles.editBtn}>
              <Pencil size={13} color={colors.primary} />
              <Text style={{ color: colors.primary, fontSize: 13, fontWeight: "600" }}>Edit</Text>
            </Pressable>
          }
        >
          <Text style={{ color: colors.text, fontWeight: "600" }}>{describeSchedule(habit.scheduleHistory.at(-1)!.schedule)}</Text>
          <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 6 }}>
            Changing your schedule only affects days from today onward — your history stays exactly as it happened.
          </Text>
        </Section>

        <Section
          title="Vacation mode"
          colors={colors}
          action={
            <Pressable onPress={() => setPauseModalOpen(true)}>
              <Text style={{ color: colors.primary, fontSize: 13, fontWeight: "600" }}>Pause</Text>
            </Pressable>
          }
        >
          <HabitPauses habitId={habit._id} />
        </Section>

        <Section title="Last 42 days" colors={colors}>
          <HabitHistoryStrip habitId={habit._id} />
          <View style={styles.legend}>
            <LegendItem color={colors.success} label="Completed" />
            <LegendItem color={colors.danger} label="Missed" />
            <LegendItem color="#60A5FA" label="Paused" />
            <LegendItem color={colors.border} label="Not scheduled" />
          </View>
        </Section>
      </ScrollView>

      <Modal visible={scheduleEditOpen} onClose={() => setScheduleEditOpen(false)} title="Edit schedule">
        <ScheduleEditModalBody habitId={habit._id} initial={habit.scheduleHistory.at(-1)!.schedule} onDone={() => setScheduleEditOpen(false)} />
      </Modal>

      <Modal visible={pauseModalOpen} onClose={() => setPauseModalOpen(false)} title="Pause this habit">
        <PauseForm habitId={habit._id} onDone={() => setPauseModalOpen(false)} />
      </Modal>
    </ScreenContainer>
  );
}

function Badge({ label, colors, tone }: { label: string; colors: ReturnType<typeof useAppTheme>["colors"]; tone?: "primary" | "danger" }) {
  const bg = tone === "primary" ? colors.primary + "22" : tone === "danger" ? colors.danger + "22" : colors.surfaceAlt;
  const fg = tone === "primary" ? colors.primary : tone === "danger" ? colors.danger : colors.textMuted;
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={{ color: fg, fontSize: 11, fontWeight: "700", textTransform: "capitalize" }}>{label}</Text>
    </View>
  );
}

function StatCard({ icon, value, label, colors }: { icon: React.ReactNode; value: string | number; label: string; colors: ReturnType<typeof useAppTheme>["colors"] }) {
  return (
    <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {icon}
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.textMuted }]}>{label}</Text>
    </View>
  );
}

function Section({
  title,
  action,
  children,
  colors,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  colors: ReturnType<typeof useAppTheme>["colors"];
}) {
  return (
    <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
        {action}
      </View>
      {children}
    </View>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={{ color: colors.textMuted, fontSize: 11 }}>{label}</Text>
    </View>
  );
}

function ScheduleEditModalBody({ habitId, initial, onDone }: { habitId: string; initial: HabitSchedule; onDone: () => void }) {
  const [schedule, setSchedule] = useState<HabitSchedule>(initial);
  const update = useUpdateHabitSchedule(habitId);

  return (
    <View style={{ gap: 16 }}>
      <ScheduleEditor value={schedule} onChange={setSchedule} />
      <Button
        label={update.isPending ? "Saving…" : "Save schedule (effective today)"}
        loading={update.isPending}
        onPress={() => update.mutate({ schedule }, { onSuccess: onDone })}
      />
    </View>
  );
}

function HabitPauses({ habitId }: { habitId: string }) {
  const { colors } = useAppTheme();
  const { data: pauses } = usePauses();
  const endNow = useEndPauseNow();
  const remove = useDeletePause();
  const habitPauses = (pauses ?? []).filter((p) => p.habitId === habitId);

  if (!habitPauses.length) {
    return <Text style={{ color: colors.textMuted, fontSize: 13 }}>No vacation windows scheduled for this habit.</Text>;
  }

  return (
    <View style={{ gap: 10 }}>
      {habitPauses.map((p) => (
        <View key={p._id} style={styles.pauseRow}>
          <Text style={{ color: colors.text, fontSize: 13, flex: 1 }}>
            {p.startDate} → {p.endDate} {p.reason ? `· ${p.reason}` : ""}
          </Text>
          <View style={{ flexDirection: "row", gap: 10 }}>
            {p.isActive ? (
              <Pressable onPress={() => endNow.mutate(p._id)}>
                <Text style={{ color: colors.primary, fontSize: 12, fontWeight: "600" }}>Resume now</Text>
              </Pressable>
            ) : null}
            <Pressable onPress={() => remove.mutate(p._id)}>
              <Text style={{ color: colors.danger, fontSize: 12, fontWeight: "600" }}>Remove</Text>
            </Pressable>
          </View>
        </View>
      ))}
    </View>
  );
}

function PauseForm({ habitId, onDone }: { habitId: string; onDone: () => void }) {
  const [startDate, setStartDate] = useState(todayStr());
  const [endDate, setEndDate] = useState(todayStr());
  const [reason, setReason] = useState("");
  const create = useCreatePause();
  const { colors } = useAppTheme();

  return (
    <View style={{ gap: 14 }}>
      <View style={{ flexDirection: "row", gap: 12 }}>
        <View style={{ flex: 1 }}>
          <TextField label="Start date" value={startDate} onChangeText={setStartDate} placeholder="YYYY-MM-DD" />
        </View>
        <View style={{ flex: 1 }}>
          <TextField label="End date" value={endDate} onChangeText={setEndDate} placeholder="YYYY-MM-DD" />
        </View>
      </View>
      <TextField label="Reason (optional)" placeholder="e.g. Vacation" value={reason} onChangeText={setReason} />
      <Button
        label={create.isPending ? "Scheduling…" : "Schedule pause"}
        loading={create.isPending}
        onPress={() => {
          if (endDate < startDate) {
            toast.error("End date must be on or after start date");
            return;
          }
          create.mutate({ habitId, startDate, endDate, reason: reason || undefined }, { onSuccess: onDone });
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 16, paddingBottom: 40 },
  loadingPad: { padding: 20 },
  header: { flexDirection: "row", gap: 14, alignItems: "flex-start" },
  iconWrap: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  headerInfo: { flex: 1, gap: 4 },
  name: { fontSize: 20, fontWeight: "800" },
  badges: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 4 },
  badge: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 8 },
  statsRow: { flexDirection: "row", gap: 10 },
  statCard: { flex: 1, borderWidth: 1, borderRadius: 14, padding: 12, gap: 4 },
  statValue: { fontSize: 18, fontWeight: "800", textTransform: "capitalize" },
  statLabel: { fontSize: 11 },
  section: { borderWidth: 1, borderRadius: 16, padding: 16, gap: 8 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sectionTitle: { fontSize: 15, fontWeight: "700" },
  editBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  legend: { flexDirection: "row", flexWrap: "wrap", gap: 14, marginTop: 10 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  pauseRow: { flexDirection: "row", alignItems: "center" },
});
