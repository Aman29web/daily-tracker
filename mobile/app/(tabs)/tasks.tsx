import { useMemo, useState } from "react";
import { View, Text, TextInput, Pressable, FlatList, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Plus, Search, ListTodo, Trash2 } from "lucide-react-native";
import ScreenContainer from "@/components/ui/ScreenContainer";
import EmptyState from "@/components/ui/EmptyState";
import Skeleton from "@/components/ui/Skeleton";
import ChipGroup from "@/components/ui/ChipGroup";
import BottomSheet from "@/components/ui/BottomSheet";
import TaskCard from "@/features/tasks/TaskCard";
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask, useSetTop3, useTop3 } from "@/features/tasks/hooks";
import { useAppTheme } from "@/hooks/useAppTheme";
import { todayStr } from "@/utils/date";
import { Task, TaskStatus } from "@/types";

const FILTERS: { value: TaskStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "todo", label: "To Do" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const MOVE_TARGETS: { value: TaskStatus; label: string }[] = [
  { value: "todo", label: "Move to To Do" },
  { value: "in_progress", label: "Move to In Progress" },
  { value: "completed", label: "Move to Completed" },
  { value: "cancelled", label: "Move to Cancelled" },
];

export default function TasksScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<TaskStatus | "all">("all");
  const [quickAdd, setQuickAdd] = useState("");
  const [actionsFor, setActionsFor] = useState<Task | null>(null);

  const { data: tasks, isLoading } = useTasks({ search: search || undefined, limit: 100 });
  const create = useCreateTask();
  const update = useUpdateTask();
  const remove = useDeleteTask();
  const setTop3 = useSetTop3();
  const { data: top3 } = useTop3(todayStr());

  const today = todayStr();
  const top3Ids = useMemo(() => new Set((top3 ?? []).map((t) => t._id)), [top3]);

  const filtered = useMemo(() => (tasks ?? []).filter((t) => filter === "all" || t.status === filter), [tasks, filter]);

  const toggleTop3 = (task: Task) => {
    const isCurrentlyTop3 = task.isTop3 && task.top3Date === today;
    const nextIds = isCurrentlyTop3 ? [...top3Ids].filter((id) => id !== task._id) : [...top3Ids, task._id];
    if (nextIds.length > 3) return;
    setTop3.mutate({ date: today, taskIds: nextIds });
  };

  const submitQuickAdd = () => {
    const title = quickAdd.trim();
    if (!title) return;
    create.mutate({ title, dueDate: today });
    setQuickAdd("");
  };

  return (
    <ScreenContainer>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={[styles.title, { color: colors.text }]}>Tasks</Text>
        <View style={[styles.searchBox, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
          <Search size={14} color={colors.textMuted} />
          <TextInput
            placeholder="Search tasks…"
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
            style={[styles.searchInput, { color: colors.text }]}
          />
        </View>
      </View>

      <View style={styles.quickAddRow}>
        <View style={[styles.quickAddBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Plus size={16} color={colors.textMuted} />
          <TextInput
            placeholder="Add a task and press enter…"
            placeholderTextColor={colors.textMuted}
            value={quickAdd}
            onChangeText={setQuickAdd}
            onSubmitEditing={submitQuickAdd}
            returnKeyType="done"
            style={[styles.quickAddInput, { color: colors.text }]}
          />
        </View>
      </View>

      <View style={styles.filterRow}>
        <ChipGroup options={FILTERS} value={filter} onChange={setFilter} />
      </View>

      {isLoading ? (
        <View style={styles.listPad}>
          <Skeleton height={64} radius={12} style={{ marginBottom: 10 }} />
          <Skeleton height={64} radius={12} style={{ marginBottom: 10 }} />
          <Skeleton height={64} radius={12} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(t) => t._id}
          contentContainerStyle={styles.listPad}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          ListEmptyComponent={
            <EmptyState icon={ListTodo} title="Nothing here" description="Add a task above, or switch filters." />
          }
          renderItem={({ item }) => (
            <TaskCard
              task={item}
              isTop3Today={item.isTop3 && item.top3Date === today}
              onToggleComplete={() => update.mutate({ id: item._id, input: { status: item.status === "completed" ? "todo" : "completed" } })}
              onToggleTop3={() => toggleTop3(item)}
              onOpenActions={() => setActionsFor(item)}
            />
          )}
        />
      )}

      <BottomSheet visible={!!actionsFor} onClose={() => setActionsFor(null)}>
        {actionsFor ? (
          <View>
            <Text style={[styles.sheetTitle, { color: colors.text }]} numberOfLines={1}>
              {actionsFor.title}
            </Text>
            {MOVE_TARGETS.filter((m) => m.value !== actionsFor.status).map((m) => (
              <Pressable
                key={m.value}
                style={styles.sheetItem}
                onPress={() => {
                  update.mutate({ id: actionsFor._id, input: { status: m.value } });
                  setActionsFor(null);
                }}
              >
                <Text style={{ color: colors.text, fontSize: 15 }}>{m.label}</Text>
              </Pressable>
            ))}
            <Pressable
              style={styles.sheetItem}
              onPress={() => {
                remove.mutate(actionsFor._id);
                setActionsFor(null);
              }}
            >
              <Trash2 size={16} color={colors.danger} />
              <Text style={{ color: colors.danger, fontSize: 15, marginLeft: 8 }}>Delete task</Text>
            </Pressable>
          </View>
        ) : null}
      </BottomSheet>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, gap: 10, paddingBottom: 4 },
  title: { fontSize: 26, fontWeight: "800" },
  searchBox: { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, height: 40 },
  searchInput: { flex: 1, fontSize: 14 },
  quickAddRow: { paddingHorizontal: 20, paddingTop: 10 },
  quickAddBox: { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, height: 44 },
  quickAddInput: { flex: 1, fontSize: 14 },
  filterRow: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4 },
  listPad: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 100, flexGrow: 1 },
  sheetTitle: { fontSize: 15, fontWeight: "700", marginBottom: 8 },
  sheetItem: { flexDirection: "row", alignItems: "center", paddingVertical: 14 },
});
