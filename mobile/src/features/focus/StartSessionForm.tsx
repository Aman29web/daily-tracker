import { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import { Play, Minus, Plus } from "lucide-react-native";
import ProgressRing from "@/components/ui/ProgressRing";
import ChipGroup from "@/components/ui/ChipGroup";
import Button from "@/components/ui/Button";
import BottomSheet from "@/components/ui/BottomSheet";
import { useStartFocus } from "./hooks";
import { useTasks } from "@/features/tasks/hooks";
import { useAppTheme } from "@/hooks/useAppTheme";
import { FocusMode } from "@/types";

export default function StartSessionForm() {
  const { colors } = useAppTheme();
  const start = useStartFocus();
  const { data: tasks } = useTasks({ status: "todo", limit: 50 });
  const [duration, setDuration] = useState<FocusMode>("25");
  const [customMinutes, setCustomMinutes] = useState(35);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [category, setCategory] = useState("general");
  const [taskPickerOpen, setTaskPickerOpen] = useState(false);

  const plannedDuration = duration === "custom" ? customMinutes : Number(duration);
  const selectedTask = tasks?.find((t) => t._id === taskId);

  return (
    <View style={styles.container}>
      <ProgressRing
        value={0}
        size={180}
        strokeWidth={12}
        label={
          <>
            <Text style={[styles.ringValue, { color: colors.text }]}>{plannedDuration}</Text>
            <Text style={[styles.ringUnit, { color: colors.textMuted }]}>minutes</Text>
          </>
        }
      />

      <ChipGroup
        value={duration}
        onChange={setDuration}
        options={[
          { value: "25", label: "25 min" },
          { value: "50", label: "50 min" },
          { value: "custom", label: "Custom" },
        ]}
      />

      {duration === "custom" ? (
        <View style={styles.stepperRow}>
          <Pressable
            style={[styles.stepBtn, { backgroundColor: colors.surfaceAlt }]}
            onPress={() => setCustomMinutes((m) => Math.max(5, m - 5))}
          >
            <Minus size={16} color={colors.text} />
          </Pressable>
          <Text style={[styles.stepperValue, { color: colors.text }]}>{customMinutes} min</Text>
          <Pressable
            style={[styles.stepBtn, { backgroundColor: colors.surfaceAlt }]}
            onPress={() => setCustomMinutes((m) => Math.min(120, m + 5))}
          >
            <Plus size={16} color={colors.text} />
          </Pressable>
        </View>
      ) : null}

      <Pressable
        onPress={() => setTaskPickerOpen(true)}
        style={[styles.selectBox, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}
      >
        <Text style={{ color: selectedTask ? colors.text : colors.textMuted }}>{selectedTask ? selectedTask.title : "No linked task"}</Text>
      </Pressable>

      <TextInput
        placeholder="Category (e.g. deep-work)"
        placeholderTextColor={colors.textMuted}
        value={category}
        onChangeText={setCategory}
        style={[styles.input, { backgroundColor: colors.surfaceAlt, borderColor: colors.border, color: colors.text }]}
      />

      <Button
        label="Start focus session"
        loading={start.isPending}
        onPress={() =>
          start.mutate({ mode: duration, plannedDuration, taskId: taskId || null, category: category || "general" })
        }
      />

      <BottomSheet visible={taskPickerOpen} onClose={() => setTaskPickerOpen(false)}>
        <Pressable
          style={styles.sheetItem}
          onPress={() => {
            setTaskId(null);
            setTaskPickerOpen(false);
          }}
        >
          <Text style={{ color: colors.text, fontSize: 15 }}>No linked task</Text>
        </Pressable>
        {(tasks ?? []).map((t) => (
          <Pressable
            key={t._id}
            style={styles.sheetItem}
            onPress={() => {
              setTaskId(t._id);
              setTaskPickerOpen(false);
            }}
          >
            <Text style={{ color: colors.text, fontSize: 15 }} numberOfLines={1}>
              {t.title}
            </Text>
          </Pressable>
        ))}
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", gap: 18 },
  ringValue: { fontSize: 34, fontWeight: "800" },
  ringUnit: { fontSize: 12, fontWeight: "600" },
  stepperRow: { flexDirection: "row", alignItems: "center", gap: 16 },
  stepBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  stepperValue: { fontSize: 15, fontWeight: "700", minWidth: 70, textAlign: "center" },
  selectBox: { width: "100%", borderWidth: 1, borderRadius: 10, padding: 12 },
  input: { width: "100%", borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 14 },
  sheetItem: { paddingVertical: 14 },
});
