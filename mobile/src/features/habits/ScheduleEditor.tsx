import { View, Text, Pressable, TextInput, StyleSheet } from "react-native";
import { HabitSchedule, ScheduleType } from "@/types";
import { useAppTheme } from "@/hooks/useAppTheme";

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

const SCHEDULE_OPTIONS: { value: ScheduleType; label: string; hint: string }[] = [
  { value: "daily", label: "Every day", hint: "No days off" },
  { value: "weekdays", label: "Specific days", hint: "Pick weekdays, e.g. Mon/Wed/Fri" },
  { value: "x_per_week", label: "X times per week", hint: "Flexible — any days" },
  { value: "x_per_month", label: "X times per month", hint: "Flexible — any days" },
  { value: "specific_dates", label: "Specific dates", hint: "One-off or custom dates" },
];

interface Props {
  value: HabitSchedule;
  onChange: (value: HabitSchedule) => void;
}

export default function ScheduleEditor({ value, onChange }: Props) {
  const { colors } = useAppTheme();

  const toggleDay = (day: number) => {
    const days = value.daysOfWeek.includes(day) ? value.daysOfWeek.filter((d) => d !== day) : [...value.daysOfWeek, day].sort();
    onChange({ ...value, daysOfWeek: days });
  };

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {SCHEDULE_OPTIONS.map((opt) => {
          const active = value.type === opt.value;
          return (
            <Pressable
              key={opt.value}
              style={[
                styles.optionBtn,
                { backgroundColor: active ? colors.primary : colors.surfaceAlt, borderColor: active ? colors.primary : colors.border },
              ]}
              onPress={() =>
                onChange({
                  type: opt.value,
                  daysOfWeek: opt.value === "weekdays" ? value.daysOfWeek : [],
                  timesPerPeriod: opt.value === "x_per_week" || opt.value === "x_per_month" ? value.timesPerPeriod ?? 3 : undefined,
                  specificDates: opt.value === "specific_dates" ? value.specificDates : [],
                })
              }
            >
              <Text style={{ color: active ? colors.primaryText : colors.text, fontWeight: "700", fontSize: 13 }}>{opt.label}</Text>
              <Text style={{ color: active ? colors.primaryText : colors.textMuted, fontSize: 11, marginTop: 2 }}>{opt.hint}</Text>
            </Pressable>
          );
        })}
      </View>

      {value.type === "weekdays" && (
        <View style={styles.dayRow}>
          {DAY_LABELS.map((label, idx) => {
            const active = value.daysOfWeek.includes(idx);
            return (
              <Pressable
                key={idx}
                onPress={() => toggleDay(idx)}
                style={[
                  styles.dayChip,
                  { backgroundColor: active ? colors.primary : colors.surfaceAlt, borderColor: active ? colors.primary : colors.border },
                ]}
              >
                <Text style={{ color: active ? colors.primaryText : colors.text, fontWeight: "700" }}>{label}</Text>
              </Pressable>
            );
          })}
        </View>
      )}

      {(value.type === "x_per_week" || value.type === "x_per_month") && (
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textMuted }]}>
            Times per {value.type === "x_per_week" ? "week" : "month"}
          </Text>
          <TextInput
            keyboardType="number-pad"
            value={String(value.timesPerPeriod ?? 3)}
            onChangeText={(t) => onChange({ ...value, timesPerPeriod: Math.max(1, Number(t.replace(/\D/g, "")) || 1) })}
            style={[styles.input, { backgroundColor: colors.surfaceAlt, borderColor: colors.border, color: colors.text }]}
          />
        </View>
      )}

      {value.type === "specific_dates" && (
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textMuted }]}>Dates (comma separated, YYYY-MM-DD)</Text>
          <TextInput
            placeholder="2026-01-01, 2026-02-14"
            placeholderTextColor={colors.textMuted}
            defaultValue={value.specificDates.join(", ")}
            onEndEditing={(e) =>
              onChange({
                ...value,
                specificDates: e.nativeEvent.text
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean),
              })
            }
            style={[styles.input, { backgroundColor: colors.surfaceAlt, borderColor: colors.border, color: colors.text }]}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  optionBtn: { width: "48%", borderWidth: 1, borderRadius: 12, padding: 10 },
  dayRow: { flexDirection: "row", gap: 6 },
  dayChip: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: "600" },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14 },
});
