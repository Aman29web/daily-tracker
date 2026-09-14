import { useState } from "react";
import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import { useNavigation } from "expo-router";
import { useLayoutEffect } from "react";
import { Plus, Target, TrendingUp, TrendingDown, Trash2, Trophy } from "lucide-react-native";
import { useGoals, useCreateGoal, useUpdateGoalProgress, useDeleteGoal } from "@/features/goals/hooks";
import Modal from "@/components/ui/Modal";
import TextField from "@/components/ui/TextField";
import Button from "@/components/ui/Button";
import ChipGroup from "@/components/ui/ChipGroup";
import EmptyState from "@/components/ui/EmptyState";
import Skeleton from "@/components/ui/Skeleton";
import ProgressRing from "@/components/ui/ProgressRing";
import ScreenContainer from "@/components/ui/ScreenContainer";
import { formatShort } from "@/utils/date";
import { useAppTheme } from "@/hooks/useAppTheme";
import { Goal, GoalStatus } from "@/types";

const TABS: { value: GoalStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "abandoned", label: "Abandoned" },
];

export default function GoalsScreen() {
  const { colors } = useAppTheme();
  const navigation = useNavigation();
  const [createOpen, setCreateOpen] = useState(false);
  const [tab, setTab] = useState<GoalStatus>("active");
  const { data: goals, isLoading } = useGoals({ status: tab });
  const remove = useDeleteGoal();
  const updateProgress = useUpdateGoalProgress();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable onPress={() => setCreateOpen(true)} hitSlop={8}>
          <Plus size={22} color={colors.primary} />
        </Pressable>
      ),
    });
  }, [navigation, colors]);

  return (
    <ScreenContainer>
      <View style={styles.tabRow}>
        <ChipGroup options={TABS} value={tab} onChange={setTab} />
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {isLoading ? (
          <>
            <Skeleton height={180} radius={18} style={{ marginBottom: 14 }} />
            <Skeleton height={180} radius={18} />
          </>
        ) : goals?.length === 0 ? (
          <EmptyState
            icon={tab === "completed" ? Trophy : Target}
            title={tab === "active" ? "Give your effort a direction." : tab === "completed" ? "No completed goals yet." : "No abandoned goals."}
            description={
              tab === "active"
                ? "Set a goal to connect daily habits to something bigger."
                : tab === "completed"
                ? "Finished goals will show up here to celebrate the win."
                : "Goals you give up on will show up here."
            }
          />
        ) : (
          goals?.map((goal) => (
            <GoalCard
              key={goal._id}
              goal={goal}
              onDelete={() => remove.mutate(goal._id)}
              onIncrement={(delta) => updateProgress.mutate({ id: goal._id, currentValue: Math.max(0, goal.currentValue + delta) })}
            />
          ))
        )}
      </ScrollView>

      <Modal visible={createOpen} onClose={() => setCreateOpen(false)} title="New goal">
        <GoalCreateForm onDone={() => setCreateOpen(false)} />
      </Modal>
    </ScreenContainer>
  );
}

function GoalCard({ goal, onDelete, onIncrement }: { goal: Goal; onDelete: () => void; onIncrement: (delta: number) => void }) {
  const { colors } = useAppTheme();
  const pct = Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100));
  const pace = goal.pace;
  const isCompleted = goal.status === "completed";

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>{goal.title}</Text>
          {isCompleted && goal.completedAt ? (
            <Text style={{ color: colors.success, fontSize: 11, marginTop: 2 }}>Completed {formatShort(goal.completedAt.slice(0, 10))}</Text>
          ) : goal.deadline ? (
            <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 2 }}>Due {formatShort(goal.deadline)}</Text>
          ) : null}
        </View>
        <Pressable onPress={onDelete} hitSlop={8}>
          <Trash2 size={16} color={colors.textMuted} />
        </Pressable>
      </View>

      <View style={styles.cardBody}>
        <ProgressRing
          value={pct}
          size={78}
          strokeWidth={8}
          color={isCompleted ? colors.success : undefined}
          label={
            isCompleted ? <Trophy size={20} color={colors.success} /> : <Text style={{ fontSize: 14, fontWeight: "800", color: colors.text }}>{pct}%</Text>
          }
        />
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={{ color: colors.text, fontWeight: "800", fontSize: 15 }}>
            {goal.currentValue} / {goal.targetValue}
          </Text>
          <Text style={{ color: colors.textMuted, fontSize: 12 }}>{goal.unit}</Text>
          {!isCompleted && pace ? (
            <View style={styles.paceRow}>
              {pace.onTrack === false ? <TrendingDown size={13} color={colors.danger} /> : <TrendingUp size={13} color={colors.success} />}
              <Text style={{ fontSize: 12, color: pace.onTrack === false ? colors.danger : pace.onTrack === true ? colors.success : colors.textMuted }}>
                {pace.onTrack === false ? "Behind pace" : pace.onTrack === true ? "On track" : `${pace.currentPacePerDay.toFixed(1)}/day`}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      {!isCompleted && goal.progressSource === "manual" ? (
        <View style={styles.actionsRow}>
          <Button label="−1" variant="secondary" onPress={() => onIncrement(-1)} />
          <View style={{ flex: 1 }}>
            <Button label={`+1 ${goal.unit}`} onPress={() => onIncrement(1)} />
          </View>
        </View>
      ) : !isCompleted ? (
        <Text style={{ color: colors.textMuted, fontSize: 12 }}>Progress updates automatically from your {goal.progressSource.replace("_", " ")}.</Text>
      ) : null}
    </View>
  );
}

function GoalCreateForm({ onDone }: { onDone: () => void }) {
  const create = useCreateGoal();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetValue, setTargetValue] = useState("10");
  const [unit, setUnit] = useState("hours");
  const [deadline, setDeadline] = useState("");

  return (
    <View style={{ gap: 14 }}>
      <TextField label="Title" placeholder="e.g. Master system design" value={title} onChangeText={setTitle} />
      <TextField label="Description (optional)" value={description} onChangeText={setDescription} multiline />
      <View style={{ flexDirection: "row", gap: 12 }}>
        <View style={{ flex: 1 }}>
          <TextField label="Target" keyboardType="numeric" value={targetValue} onChangeText={setTargetValue} />
        </View>
        <View style={{ flex: 1 }}>
          <TextField label="Unit" placeholder="hours, sessions…" value={unit} onChangeText={setUnit} />
        </View>
      </View>
      <TextField label="Deadline (optional)" placeholder="YYYY-MM-DD" value={deadline} onChangeText={setDeadline} />
      <Button
        label={create.isPending ? "Adding…" : "Create goal"}
        loading={create.isPending}
        onPress={() => {
          if (!title.trim()) return;
          create.mutate(
            { title, description: description || undefined, targetValue: Number(targetValue) || 0, unit, deadline: deadline || undefined },
            { onSuccess: onDone }
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  tabRow: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 4 },
  list: { padding: 20, gap: 14, paddingTop: 10 },
  card: { borderWidth: 1, borderRadius: 16, padding: 16, gap: 14 },
  cardHeader: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  cardTitle: { fontSize: 16, fontWeight: "700" },
  cardBody: { flexDirection: "row", alignItems: "center", gap: 16 },
  paceRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 2 },
  actionsRow: { flexDirection: "row", gap: 10 },
});
