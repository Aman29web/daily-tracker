import { View, Text, Pressable, StyleSheet } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { HABIT_CATEGORIES, HABIT_COLORS, HABIT_ICONS } from "@/constants/habitOptions";
import DynamicIcon from "@/components/ui/DynamicIcon";
import TextField from "@/components/ui/TextField";
import ChipGroup from "@/components/ui/ChipGroup";
import Button from "@/components/ui/Button";
import ScheduleEditor from "./ScheduleEditor";
import { Habit } from "@/types";
import { useAppTheme } from "@/hooks/useAppTheme";

const scheduleSchema = z.object({
  type: z.enum(["daily", "weekdays", "x_per_week", "x_per_month", "specific_dates"]),
  daysOfWeek: z.array(z.number()),
  timesPerPeriod: z.number().optional(),
  specificDates: z.array(z.string()),
});

const schema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(500).optional(),
  icon: z.string(),
  color: z.string(),
  category: z.string(),
  type: z.enum(["boolean", "numeric"]),
  targetValue: z.number().positive().optional(),
  targetUnit: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]),
  reminderTime: z.string().optional(),
  startDate: z.string().min(1),
  schedule: scheduleSchema,
});

export type HabitFormValues = z.infer<typeof schema>;

interface Props {
  initial?: Partial<Habit>;
  onSubmit: (values: HabitFormValues) => void;
  submitting?: boolean;
  submitLabel?: string;
}

const today = new Date().toISOString().slice(0, 10);

export default function HabitForm({ initial, onSubmit, submitting, submitLabel = "Create habit" }: Props) {
  const { colors } = useAppTheme();
  const latestSchedule = initial?.scheduleHistory?.at(-1)?.schedule;

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<HabitFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initial?.name ?? "",
      description: initial?.description ?? "",
      icon: initial?.icon ?? "target",
      color: initial?.color ?? HABIT_COLORS[0],
      category: initial?.category ?? "general",
      type: initial?.type ?? "boolean",
      targetValue: initial?.target?.value,
      targetUnit: initial?.target?.unit ?? "",
      priority: initial?.priority ?? "medium",
      reminderTime: initial?.reminderTime ?? "",
      startDate: initial?.startDate?.slice(0, 10) ?? today,
      schedule: latestSchedule ?? { type: "daily", daysOfWeek: [], specificDates: [] },
    },
  });

  const type = watch("type");

  return (
    <View style={styles.form}>
      <Controller
        control={control}
        name="name"
        render={({ field }) => (
          <TextField label="Name" placeholder="e.g. Morning run" value={field.value} onChangeText={field.onChange} error={errors.name?.message} />
        )}
      />

      <Controller
        control={control}
        name="description"
        render={({ field }) => (
          <TextField
            label="Description (optional)"
            placeholder="What does success look like?"
            value={field.value}
            onChangeText={field.onChange}
            multiline
          />
        )}
      />

      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.textMuted }]}>Icon</Text>
        <Controller
          control={control}
          name="icon"
          render={({ field }) => (
            <View style={styles.iconGrid}>
              {HABIT_ICONS.map((i) => {
                const active = field.value === i;
                return (
                  <Pressable
                    key={i}
                    onPress={() => field.onChange(i)}
                    style={[
                      styles.iconSwatch,
                      { backgroundColor: active ? colors.primary : colors.surfaceAlt, borderColor: active ? colors.primary : colors.border },
                    ]}
                  >
                    <DynamicIcon name={i} size={18} color={active ? colors.primaryText : colors.text} />
                  </Pressable>
                );
              })}
            </View>
          )}
        />
      </View>

      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.textMuted }]}>Color</Text>
        <Controller
          control={control}
          name="color"
          render={({ field }) => (
            <View style={styles.colorGrid}>
              {HABIT_COLORS.map((c) => (
                <Pressable
                  key={c}
                  onPress={() => field.onChange(c)}
                  style={[
                    styles.colorSwatch,
                    { backgroundColor: c, borderColor: field.value === c ? colors.text : "transparent" },
                  ]}
                />
              ))}
            </View>
          )}
        />
      </View>

      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.textMuted }]}>Category</Text>
        <Controller
          control={control}
          name="category"
          render={({ field }) => (
            <ChipGroup
              value={field.value}
              onChange={field.onChange}
              options={HABIT_CATEGORIES.map((c) => ({ value: c, label: c[0].toUpperCase() + c.slice(1) }))}
            />
          )}
        />
      </View>

      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.textMuted }]}>Priority</Text>
        <Controller
          control={control}
          name="priority"
          render={({ field }) => (
            <ChipGroup
              value={field.value}
              onChange={field.onChange}
              options={[
                { value: "low", label: "Low" },
                { value: "medium", label: "Medium" },
                { value: "high", label: "High" },
              ]}
            />
          )}
        />
      </View>

      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.textMuted }]}>Type</Text>
        <Controller
          control={control}
          name="type"
          render={({ field }) => (
            <ChipGroup
              value={field.value}
              onChange={field.onChange}
              options={[
                { value: "boolean", label: "Yes / No" },
                { value: "numeric", label: "Numeric target" },
              ]}
            />
          )}
        />
      </View>

      {type === "numeric" && (
        <View style={styles.row}>
          <View style={styles.flex1}>
            <Controller
              control={control}
              name="targetValue"
              render={({ field }) => (
                <TextField
                  label="Target value"
                  keyboardType="numeric"
                  value={field.value !== undefined ? String(field.value) : ""}
                  onChangeText={(t) => field.onChange(t ? Number(t) : undefined)}
                />
              )}
            />
          </View>
          <View style={styles.flex1}>
            <Controller
              control={control}
              name="targetUnit"
              render={({ field }) => (
                <TextField label="Unit" placeholder="glasses, minutes…" value={field.value} onChangeText={field.onChange} />
              )}
            />
          </View>
        </View>
      )}

      <View style={styles.row}>
        <View style={styles.flex1}>
          <Controller
            control={control}
            name="startDate"
            render={({ field }) => (
              <TextField label="Start date" placeholder="YYYY-MM-DD" value={field.value} onChangeText={field.onChange} />
            )}
          />
        </View>
        <View style={styles.flex1}>
          <Controller
            control={control}
            name="reminderTime"
            render={({ field }) => (
              <TextField label="Reminder (optional)" placeholder="HH:MM" value={field.value} onChangeText={field.onChange} />
            )}
          />
        </View>
      </View>

      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.textMuted }]}>Schedule</Text>
        <Controller control={control} name="schedule" render={({ field }) => <ScheduleEditor value={field.value} onChange={field.onChange} />} />
      </View>

      <Button label={submitting ? "Saving…" : submitLabel} loading={submitting} onPress={handleSubmit(onSubmit)} />
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: 16 },
  field: { gap: 8 },
  label: { fontSize: 13, fontWeight: "600" },
  row: { flexDirection: "row", gap: 12 },
  flex1: { flex: 1 },
  iconGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  iconSwatch: { width: 40, height: 40, borderRadius: 10, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  colorGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  colorSwatch: { width: 30, height: 30, borderRadius: 15, borderWidth: 2 },
});
