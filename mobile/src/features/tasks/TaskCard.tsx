import { View, Text, Pressable, StyleSheet } from "react-native";
import { Star, Clock, MoreVertical } from "lucide-react-native";
import { Task } from "@/types";
import { formatShort } from "@/utils/date";
import { useAppTheme } from "@/hooks/useAppTheme";

const PRIORITY_COLOR: Record<string, "neutral" | "primary" | "warning" | "danger"> = {
  low: "neutral",
  medium: "primary",
  high: "warning",
  urgent: "danger",
};

interface Props {
  task: Task;
  /** Whether this task is in *today's* Top 3 — not the same as task.isTop3, which reflects whatever date it was last starred for. */
  isTop3Today: boolean;
  onToggleComplete: () => void;
  onToggleTop3: () => void;
  onOpenActions: () => void;
}

export default function TaskCard({ task, isTop3Today, onToggleComplete, onToggleTop3, onOpenActions }: Props) {
  const { colors } = useAppTheme();
  const done = task.status === "completed";
  const tone = PRIORITY_COLOR[task.priority];
  const toneColor = tone === "danger" ? colors.danger : tone === "warning" ? colors.warning : tone === "primary" ? colors.primary : colors.textMuted;

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Pressable
        onPress={onToggleComplete}
        style={[styles.check, { borderColor: done ? colors.success : colors.border, backgroundColor: done ? colors.success : "transparent" }]}
      />
      <View style={styles.info}>
        <Text style={[styles.title, { color: done ? colors.textMuted : colors.text, textDecorationLine: done ? "line-through" : "none" }]} numberOfLines={2}>
          {task.title}
        </Text>
        <View style={styles.meta}>
          <View style={[styles.priorityBadge, { backgroundColor: toneColor + "22" }]}>
            <Text style={{ color: toneColor, fontSize: 10, fontWeight: "700", textTransform: "capitalize" }}>{task.priority}</Text>
          </View>
          {task.dueDate ? (
            <View style={styles.due}>
              <Clock size={11} color={colors.textMuted} />
              <Text style={{ color: colors.textMuted, fontSize: 11 }}>{formatShort(task.dueDate)}</Text>
            </View>
          ) : null}
        </View>
      </View>
      <Pressable onPress={onToggleTop3} hitSlop={8}>
        <Star size={16} color={isTop3Today ? colors.warning : colors.textMuted} fill={isTop3Today ? colors.warning : "none"} />
      </Pressable>
      <Pressable onPress={onOpenActions} hitSlop={8}>
        <MoreVertical size={16} color={colors.textMuted} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderRadius: 12, padding: 12 },
  check: { width: 20, height: 20, borderRadius: 6, borderWidth: 2 },
  info: { flex: 1, gap: 4, minWidth: 0 },
  title: { fontSize: 14, fontWeight: "600" },
  meta: { flexDirection: "row", alignItems: "center", gap: 8 },
  priorityBadge: { paddingVertical: 2, paddingHorizontal: 6, borderRadius: 6 },
  due: { flexDirection: "row", alignItems: "center", gap: 3 },
});
