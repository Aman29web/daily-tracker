import { useMemo, useState } from "react";
import { View, Text, Pressable, TextInput, StyleSheet, SectionList } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Plus, Repeat, Search, ChevronRight } from "lucide-react-native";
import ScreenContainer from "@/components/ui/ScreenContainer";
import EmptyState from "@/components/ui/EmptyState";
import Skeleton from "@/components/ui/Skeleton";
import Modal from "@/components/ui/Modal";
import HabitForm from "@/features/habits/HabitForm";
import HabitCheckItem from "@/features/habits/HabitCheckItem";
import { useHabits, useCreateHabit, useCheckIn, toCreateInput } from "@/features/habits/hooks";
import { useAppTheme } from "@/hooks/useAppTheme";
import { todayStr } from "@/utils/date";
import { HabitWithStats } from "@/types";

function groupByCategory(items: HabitWithStats[]) {
  const map = items.reduce<Record<string, HabitWithStats[]>>((acc, item) => {
    const key = item.habit.category || "general";
    acc[key] = acc[key] ? [...acc[key], item] : [item];
    return acc;
  }, {});
  return Object.entries(map).map(([title, data]) => ({ title, data }));
}

export default function HabitsScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const { data: habits, isLoading } = useHabits(showInactive ? undefined : { isActive: true });
  const create = useCreateHabit();

  const filtered = useMemo(
    () => (habits ?? []).filter((h) => h.habit.name.toLowerCase().includes(search.toLowerCase())),
    [habits, search]
  );
  const sections = useMemo(() => groupByCategory(filtered), [filtered]);

  return (
    <ScreenContainer>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>Habits</Text>
          <Text style={{ color: colors.textMuted }}>Everything you're building, day by day.</Text>
        </View>
        <Pressable onPress={() => setCreateOpen(true)} style={[styles.addBtn, { backgroundColor: colors.primary }]}>
          <Plus size={20} color={colors.primaryText} />
        </Pressable>
      </View>

      <View style={styles.toolbar}>
        <View style={[styles.searchBox, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
          <Search size={14} color={colors.textMuted} />
          <TextInput
            placeholder="Search habits…"
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
            style={[styles.searchInput, { color: colors.text }]}
          />
        </View>
        <Pressable style={styles.toggleRow} onPress={() => setShowInactive((v) => !v)}>
          <View
            style={[
              styles.checkbox,
              { borderColor: colors.border, backgroundColor: showInactive ? colors.primary : "transparent" },
            ]}
          >
            {showInactive ? <Text style={{ color: colors.primaryText, fontSize: 10 }}>✓</Text> : null}
          </View>
          <Text style={{ color: colors.textMuted, fontSize: 13 }}>Show inactive</Text>
        </Pressable>
      </View>

      {isLoading ? (
        <View style={styles.listPad}>
          <Skeleton height={90} radius={16} style={{ marginBottom: 14 }} />
          <Skeleton height={90} radius={16} style={{ marginBottom: 14 }} />
          <Skeleton height={90} radius={16} />
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.habit._id}
          contentContainerStyle={styles.listPad}
          ListEmptyComponent={
            <EmptyState
              icon={Repeat}
              title="Your first habit starts here."
              description="Create a habit, set a flexible schedule, and start building your streak."
            />
          }
          renderSectionHeader={({ section }) => (
            <Text style={[styles.sectionTitle, { color: colors.textMuted, backgroundColor: colors.bg }]}>{section.title}</Text>
          )}
          renderItem={({ item }) => <HabitRow item={item} onPress={() => router.push(`/(tabs)/habits/${item.habit._id}`)} />}
          ItemSeparatorComponent={() => <View style={[styles.separator, { backgroundColor: colors.border }]} />}
        />
      )}

      <Modal visible={createOpen} onClose={() => setCreateOpen(false)} title="New habit">
        <HabitForm
          submitting={create.isPending}
          onSubmit={(values) => {
            create.mutate(toCreateInput(values), { onSuccess: () => setCreateOpen(false) });
          }}
        />
      </Modal>
    </ScreenContainer>
  );
}

function HabitRow({ item, onPress }: { item: HabitWithStats; onPress: () => void }) {
  const { habit, today: todayStatus, streak } = item;
  const checkIn = useCheckIn(habit._id);
  const today = todayStr();
  const { colors } = useAppTheme();

  return (
    <View style={styles.rowWrap}>
      <View style={{ flex: 1 }}>
        <HabitCheckItem
          item={{
            id: habit._id,
            name: habit.name,
            icon: habit.icon,
            color: habit.color,
            type: habit.type,
            priority: habit.priority,
            status: todayStatus.status,
            value: todayStatus.value,
            targetValue: todayStatus.targetValue ?? habit.target?.value,
            unit: habit.target?.unit,
            streak: streak.current,
          }}
          onComplete={() => checkIn.mutate({ date: today, action: "complete" })}
          onUndo={() => checkIn.mutate({ date: today, action: "undo" })}
          onSkip={() => checkIn.mutate({ date: today, action: "skip" })}
          onMiss={() => checkIn.mutate({ date: today, action: "miss" })}
          onIncrement={(delta) => checkIn.mutate({ date: today, action: "increment", value: delta })}
        />
      </View>
      <Pressable onPress={onPress} hitSlop={8} style={{ paddingLeft: 8 }}>
        <ChevronRight size={18} color={colors.textMuted} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", paddingHorizontal: 20, paddingBottom: 12 },
  title: { fontSize: 26, fontWeight: "800" },
  addBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  toolbar: { paddingHorizontal: 20, gap: 10, paddingBottom: 8 },
  searchBox: { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, height: 40 },
  searchInput: { flex: 1, fontSize: 14 },
  toggleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  checkbox: { width: 18, height: 18, borderRadius: 5, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  listPad: { paddingHorizontal: 20, paddingBottom: 100, flexGrow: 1 },
  sectionTitle: { fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5, paddingVertical: 10 },
  rowWrap: { flexDirection: "row", alignItems: "center" },
  separator: { height: StyleSheet.hairlineWidth },
});
