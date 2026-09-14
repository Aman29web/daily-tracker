import { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Check, MoreHorizontal, Minus, Plus, SkipForward, X, Flame } from "lucide-react-native";
import DynamicIcon from "@/components/ui/DynamicIcon";
import BottomSheet from "@/components/ui/BottomSheet";
import { useAppTheme } from "@/hooks/useAppTheme";
import { DayStatus, HabitType, Priority } from "@/types";

export interface HabitCheckItemData {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: HabitType;
  priority: Priority;
  status: DayStatus;
  value?: number;
  targetValue?: number;
  unit?: string;
  streak?: number;
}

interface Props {
  item: HabitCheckItemData;
  onComplete: () => void;
  onUndo: () => void;
  onSkip: () => void;
  onMiss: () => void;
  onIncrement: (delta: number) => void;
  disabled?: boolean;
}

const STATUS_LABEL: Partial<Record<DayStatus, string>> = {
  paused: "Paused",
  rest_day: "Rest day",
  not_scheduled: "Flexible",
  skipped: "Skipped",
  missed: "Missed",
};

export default function HabitCheckItem({ item, onComplete, onUndo, onSkip, onMiss, onIncrement, disabled }: Props) {
  const { colors } = useAppTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  const isDone = item.status === "completed";
  const isInert = ["paused", "rest_day", "not_scheduled", "inactive", "upcoming"].includes(item.status);
  const canInteract = !disabled && !isInert;

  return (
    <View style={[styles.row, isInert && styles.inert]}>
      {item.type === "boolean" ? (
        <Pressable
          disabled={!canInteract}
          onPress={() => (isDone ? onUndo() : onComplete())}
          style={[
            styles.checkCircle,
            { borderColor: isDone ? item.color : colors.border, backgroundColor: isDone ? item.color : "transparent" },
          ]}
        >
          {isDone ? <Check size={15} color="#fff" strokeWidth={3} /> : null}
        </Pressable>
      ) : (
        <View style={[styles.iconCircle, { backgroundColor: item.color + "22" }]}>
          <DynamicIcon name={item.icon} size={16} color={item.color} />
        </View>
      )}

      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
          {item.name}
        </Text>
        {item.type === "numeric" ? (
          <View style={styles.progressWrap}>
            <View style={[styles.progressTrack, { backgroundColor: colors.surfaceAlt }]}>
              <View
                style={[
                  styles.progressFill,
                  { backgroundColor: item.color, width: `${Math.min(100, ((item.value ?? 0) / (item.targetValue || 1)) * 100)}%` },
                ]}
              />
            </View>
            <Text style={[styles.progressLabel, { color: colors.textMuted }]}>
              {item.value ?? 0} / {item.targetValue} {item.unit}
            </Text>
          </View>
        ) : STATUS_LABEL[item.status] ? (
          <Text style={[styles.statusLabel, { color: colors.textMuted }]}>{STATUS_LABEL[item.status]}</Text>
        ) : null}
      </View>

      {!!item.streak && item.streak > 0 && (
        <View style={styles.streak}>
          <Flame size={12} color={colors.warning} />
          <Text style={[styles.streakText, { color: colors.warning }]}>{item.streak}</Text>
        </View>
      )}

      {item.type === "numeric" && canInteract && (
        <View style={styles.stepper}>
          <Pressable onPress={() => onIncrement(-1)} style={[styles.stepBtn, { backgroundColor: colors.surfaceAlt }]}>
            <Minus size={13} color={colors.text} />
          </Pressable>
          <Pressable onPress={() => onIncrement(1)} style={[styles.stepBtn, { backgroundColor: colors.surfaceAlt }]}>
            <Plus size={13} color={colors.text} />
          </Pressable>
        </View>
      )}

      {item.type === "boolean" && canInteract && (
        <>
          <Pressable onPress={() => setMenuOpen(true)} style={[styles.stepBtn, { backgroundColor: colors.surfaceAlt }]}>
            <MoreHorizontal size={16} color={colors.text} />
          </Pressable>
          <BottomSheet visible={menuOpen} onClose={() => setMenuOpen(false)} maxHeightRatio={0.3}>
            <Pressable
              style={styles.menuItem}
              onPress={() => {
                setMenuOpen(false);
                onSkip();
              }}
            >
              <SkipForward size={16} color={colors.text} />
              <Text style={[styles.menuLabel, { color: colors.text }]}>Skip today</Text>
            </Pressable>
            <Pressable
              style={styles.menuItem}
              onPress={() => {
                setMenuOpen(false);
                onMiss();
              }}
            >
              <X size={16} color={colors.danger} />
              <Text style={[styles.menuLabel, { color: colors.danger }]}>Mark missed</Text>
            </Pressable>
          </BottomSheet>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 8 },
  inert: { opacity: 0.5 },
  checkCircle: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  iconCircle: { width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  info: { flex: 1, gap: 4 },
  name: { fontSize: 14, fontWeight: "600" },
  statusLabel: { fontSize: 12 },
  progressWrap: { gap: 4 },
  progressTrack: { height: 5, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 3 },
  progressLabel: { fontSize: 11 },
  streak: { flexDirection: "row", alignItems: "center", gap: 2 },
  streakText: { fontSize: 12, fontWeight: "700" },
  stepper: { flexDirection: "row", gap: 6 },
  stepBtn: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  menuItem: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 14 },
  menuLabel: { fontSize: 15, fontWeight: "600" },
});
