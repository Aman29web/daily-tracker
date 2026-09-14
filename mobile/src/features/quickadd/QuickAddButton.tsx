import { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Plus, Repeat, CheckSquare, Target, BookOpen, Timer } from "lucide-react-native";
import BottomSheet from "@/components/ui/BottomSheet";
import { useUiStore, QuickAddKind } from "@/stores/uiStore";
import { useAppTheme } from "@/hooks/useAppTheme";

const OPTIONS: { kind: Exclude<QuickAddKind, null>; label: string; icon: typeof Repeat }[] = [
  { kind: "habit", label: "Habit", icon: Repeat },
  { kind: "task", label: "Task", icon: CheckSquare },
  { kind: "goal", label: "Goal", icon: Target },
  { kind: "journal", label: "Journal", icon: BookOpen },
  { kind: "focus", label: "Focus session", icon: Timer },
];

export default function QuickAddButton() {
  const { colors } = useAppTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const openQuickAdd = useUiStore((s) => s.openQuickAdd);

  return (
    <>
      <Pressable style={[styles.fab, { backgroundColor: colors.primary }]} onPress={() => setMenuOpen(true)}>
        <Plus size={24} color={colors.primaryText} />
      </Pressable>

      <BottomSheet visible={menuOpen} onClose={() => setMenuOpen(false)} maxHeightRatio={0.5}>
        {OPTIONS.map((opt) => (
          <Pressable
            key={opt.kind}
            style={styles.item}
            onPress={() => {
              setMenuOpen(false);
              openQuickAdd(opt.kind);
            }}
          >
            <opt.icon size={17} color={colors.text} />
            <Text style={{ color: colors.text, fontSize: 15, fontWeight: "600" }}>{opt.label}</Text>
          </Pressable>
        ))}
      </BottomSheet>
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    right: 20,
    bottom: 88,
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  item: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 14 },
});
