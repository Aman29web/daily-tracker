import { useState } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import BottomSheet from "@/components/ui/BottomSheet";
import TextField from "@/components/ui/TextField";
import ChipGroup from "@/components/ui/ChipGroup";
import Button from "@/components/ui/Button";
import HabitForm from "@/features/habits/HabitForm";
import { toCreateInput, useCreateHabit } from "@/features/habits/hooks";
import { useCreateTask } from "@/features/tasks/hooks";
import { useCreateGoal } from "@/features/goals/hooks";
import { useUpsertJournal } from "@/features/journal/hooks";
import { useStartFocus } from "@/features/focus/hooks";
import { useUiStore } from "@/stores/uiStore";
import { useAppTheme } from "@/hooks/useAppTheme";
import { todayStr } from "@/utils/date";
import { TaskPriority } from "@/types";

const TITLES: Record<string, string> = {
  habit: "New habit",
  task: "New task",
  journal: "Today's journal",
  goal: "New goal",
  focus: "Start focus session",
};

export default function QuickAddSheet() {
  const kind = useUiStore((s) => s.quickAddKind);
  const close = useUiStore((s) => s.closeQuickAdd);
  const { colors } = useAppTheme();

  return (
    <BottomSheet visible={!!kind} onClose={close} maxHeightRatio={0.9}>
      {kind ? (
        <ScrollView contentContainerStyle={{ paddingBottom: 20 }} keyboardShouldPersistTaps="handled">
          <Text style={[styles.title, { color: colors.text }]}>{TITLES[kind]}</Text>
          {kind === "habit" ? <QuickHabitForm /> : null}
          {kind === "task" ? <QuickTaskForm /> : null}
          {kind === "goal" ? <QuickGoalForm /> : null}
          {kind === "journal" ? <QuickJournalForm /> : null}
          {kind === "focus" ? <QuickFocusForm /> : null}
        </ScrollView>
      ) : null}
    </BottomSheet>
  );
}

function QuickHabitForm() {
  const close = useUiStore((s) => s.closeQuickAdd);
  const create = useCreateHabit();
  return <HabitForm submitting={create.isPending} onSubmit={(values) => create.mutate(toCreateInput(values), { onSuccess: close })} />;
}

function QuickTaskForm() {
  const close = useUiStore((s) => s.closeQuickAdd);
  const create = useCreateTask();
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");

  return (
    <View style={styles.form}>
      <TextField label="Title" placeholder="What needs to get done?" value={title} onChangeText={setTitle} />
      <View>
        <Text style={styles.fieldLabel}>Priority</Text>
        <ChipGroup
          value={priority}
          onChange={setPriority}
          options={[
            { value: "low", label: "Low" },
            { value: "medium", label: "Medium" },
            { value: "high", label: "High" },
            { value: "urgent", label: "Urgent" },
          ]}
        />
      </View>
      <Button
        label={create.isPending ? "Adding…" : "Add task"}
        loading={create.isPending}
        onPress={() => {
          if (!title.trim()) return;
          create.mutate({ title, priority, dueDate: todayStr() }, { onSuccess: close });
        }}
      />
    </View>
  );
}

function QuickGoalForm() {
  const close = useUiStore((s) => s.closeQuickAdd);
  const create = useCreateGoal();
  const [title, setTitle] = useState("");
  const [targetValue, setTargetValue] = useState("10");
  const [unit, setUnit] = useState("hours");

  return (
    <View style={styles.form}>
      <TextField label="Title" placeholder="e.g. Master system design" value={title} onChangeText={setTitle} />
      <View style={{ flexDirection: "row", gap: 12 }}>
        <View style={{ flex: 1 }}>
          <TextField label="Target" keyboardType="numeric" value={targetValue} onChangeText={setTargetValue} />
        </View>
        <View style={{ flex: 1 }}>
          <TextField label="Unit" value={unit} onChangeText={setUnit} />
        </View>
      </View>
      <Button
        label={create.isPending ? "Adding…" : "Add goal"}
        loading={create.isPending}
        onPress={() => {
          if (!title.trim()) return;
          create.mutate({ title, targetValue: Number(targetValue) || 0, unit }, { onSuccess: close });
        }}
      />
    </View>
  );
}

function QuickJournalForm() {
  const close = useUiStore((s) => s.closeQuickAdd);
  const upsert = useUpsertJournal();
  const [wentWell, setWentWell] = useState("");
  const [learned, setLearned] = useState("");

  return (
    <View style={styles.form}>
      <TextField label="What went well today?" value={wentWell} onChangeText={setWentWell} multiline />
      <TextField label="What did you learn?" value={learned} onChangeText={setLearned} multiline />
      <Button
        label={upsert.isPending ? "Saving…" : "Save entry"}
        loading={upsert.isPending}
        onPress={() => upsert.mutate({ date: todayStr(), wentWell, learned }, { onSuccess: close })}
      />
    </View>
  );
}

function QuickFocusForm() {
  const close = useUiStore((s) => s.closeQuickAdd);
  const start = useStartFocus();
  const router = useRouter();
  const [duration, setDuration] = useState<"25" | "50">("25");

  return (
    <View style={styles.form}>
      <View>
        <Text style={styles.fieldLabel}>Session length</Text>
        <ChipGroup
          value={duration}
          onChange={setDuration}
          options={[
            { value: "25", label: "25 min" },
            { value: "50", label: "50 min" },
          ]}
        />
      </View>
      <Button
        label={start.isPending ? "Starting…" : "Start session"}
        loading={start.isPending}
        onPress={() => {
          start.mutate(
            { mode: duration, plannedDuration: Number(duration), category: "general" },
            {
              onSuccess: () => {
                close();
                router.push("/(tabs)/focus");
              },
            }
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 17, fontWeight: "800", marginBottom: 14 },
  form: { gap: 14 },
  fieldLabel: { fontSize: 13, fontWeight: "600", marginBottom: 8, color: "#888" },
});
