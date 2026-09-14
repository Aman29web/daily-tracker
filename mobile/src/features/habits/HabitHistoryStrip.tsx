import { View, StyleSheet } from "react-native";
import { useHabitRange } from "./hooks";
import { addDaysStr, todayStr } from "@/utils/date";
import { dayStatusColor } from "@/constants/dayStatusColors";
import { useAppTheme } from "@/hooks/useAppTheme";
import Skeleton from "@/components/ui/Skeleton";

export default function HabitHistoryStrip({ habitId, days = 42 }: { habitId: string; days?: number }) {
  const { colors } = useAppTheme();
  const end = todayStr();
  const start = addDaysStr(end, -(days - 1));
  const { data, isLoading } = useHabitRange(habitId, start, end);

  if (isLoading || !data) return <Skeleton height={64} radius={10} />;

  return (
    <View style={styles.strip}>
      {data.map((d) => (
        <View key={d.date} style={[styles.cell, { backgroundColor: dayStatusColor(d.status, colors) }]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  strip: { flexDirection: "row", flexWrap: "wrap", gap: 4 },
  cell: { width: 16, height: 16, borderRadius: 3 },
});
