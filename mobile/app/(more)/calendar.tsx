import { useMemo, useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { startOfMonth, endOfMonth, addMonths, format } from "date-fns";
import { useCalendarRange } from "@/features/calendar/hooks";
import DayDetailSheet from "@/features/calendar/DayDetailSheet";
import Skeleton from "@/components/ui/Skeleton";
import ScreenContainer from "@/components/ui/ScreenContainer";
import { dayOfWeek, todayStr } from "@/utils/date";
import { useAppTheme } from "@/hooks/useAppTheme";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function heatColor(score: number, colors: ReturnType<typeof useAppTheme>["colors"]): string {
  if (score >= 80) return colors.success;
  if (score >= 60) return colors.success + "AA";
  if (score >= 35) return colors.warning + "AA";
  if (score > 0) return colors.warning + "55";
  return colors.surfaceAlt;
}

export default function CalendarScreen() {
  const { colors } = useAppTheme();
  const [cursor, setCursor] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const today = todayStr();

  const monthStart = startOfMonth(cursor);
  const monthEnd = endOfMonth(cursor);
  const startStr = format(monthStart, "yyyy-MM-dd");
  const endStr = format(monthEnd, "yyyy-MM-dd");

  const { data, isLoading } = useCalendarRange(startStr, endStr);
  const dataMap = useMemo(() => new Map((data ?? []).map((d) => [d.date, d])), [data]);

  const leadingBlanks = (dayOfWeek(startStr) + 6) % 7;
  const daysInMonth = monthEnd.getDate();
  const cells: (string | null)[] = [
    ...Array(leadingBlanks).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => startStr.slice(0, 8) + String(i + 1).padStart(2, "0")),
  ];

  return (
    <ScreenContainer>
      <View style={styles.container}>
        <View style={styles.navRow}>
          <Pressable onPress={() => setCursor(addMonths(cursor, -1))} style={[styles.navBtn, { backgroundColor: colors.surfaceAlt }]}>
            <ChevronLeft size={16} color={colors.text} />
          </Pressable>
          <Text style={[styles.monthLabel, { color: colors.text }]}>{format(cursor, "MMMM yyyy")}</Text>
          <Pressable onPress={() => setCursor(addMonths(cursor, 1))} style={[styles.navBtn, { backgroundColor: colors.surfaceAlt }]}>
            <ChevronRight size={16} color={colors.text} />
          </Pressable>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.weekdaysRow}>
            {WEEKDAYS.map((w) => (
              <Text key={w} style={[styles.weekday, { color: colors.textMuted }]}>
                {w}
              </Text>
            ))}
          </View>

          {isLoading ? (
            <Skeleton height={260} radius={12} />
          ) : (
            <View style={styles.grid}>
              {cells.map((date, idx) => {
                if (!date) return <View key={idx} style={styles.cell} />;
                const day = dataMap.get(date);
                const hasData = day?.hasData ?? false;
                const isToday = date === today;
                return (
                  <Pressable
                    key={date}
                    onPress={() => setSelectedDate(date)}
                    style={[
                      styles.cell,
                      styles.dayCell,
                      { backgroundColor: hasData ? heatColor(day!.productivityScore, colors) : colors.surfaceAlt },
                      isToday && { borderWidth: 2, borderColor: colors.primary },
                    ]}
                  >
                    <Text style={[styles.dayNum, { color: colors.text }]}>{Number(date.slice(-2))}</Text>
                    {day?.journalCompleted ? <View style={[styles.dot, { backgroundColor: colors.primary }]} /> : null}
                  </Pressable>
                );
              })}
            </View>
          )}

          <View style={styles.legendRow}>
            <Text style={{ color: colors.textMuted, fontSize: 11 }}>Less</Text>
            {[0, 20, 40, 65, 85].map((s) => (
              <View key={s} style={[styles.legendSwatch, { backgroundColor: heatColor(s, colors) }]} />
            ))}
            <Text style={{ color: colors.textMuted, fontSize: 11 }}>More</Text>
          </View>
        </View>
      </View>

      <DayDetailSheet date={selectedDate} onClose={() => setSelectedDate(null)} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 14 },
  navRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 16 },
  navBtn: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  monthLabel: { fontSize: 16, fontWeight: "700", minWidth: 140, textAlign: "center" },
  card: { borderWidth: 1, borderRadius: 16, padding: 12, gap: 10 },
  weekdaysRow: { flexDirection: "row" },
  weekday: { flex: 1, textAlign: "center", fontSize: 11, fontWeight: "600" },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  cell: { width: `${100 / 7}%`, aspectRatio: 1, padding: 2 },
  dayCell: { borderRadius: 8, alignItems: "center", justifyContent: "center", margin: 1 },
  dayNum: { fontSize: 11, fontWeight: "600" },
  dot: { width: 4, height: 4, borderRadius: 2, marginTop: 2 },
  legendRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, marginTop: 4 },
  legendSwatch: { width: 12, height: 12, borderRadius: 3 },
});
