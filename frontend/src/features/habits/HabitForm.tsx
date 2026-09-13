import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { HABIT_CATEGORIES, HABIT_COLORS, HABIT_ICONS } from "../../constants/habitOptions";
import DynamicIcon from "../../components/ui/DynamicIcon";
import ScheduleEditor from "./ScheduleEditor";
import { Habit } from "../../types";
import "./HabitForm.css";

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

interface HabitFormProps {
  initial?: Partial<Habit>;
  onSubmit: (values: HabitFormValues) => Promise<void> | void;
  submitting?: boolean;
  submitLabel?: string;
}

const today = new Date().toISOString().slice(0, 10);

export default function HabitForm({ initial, onSubmit, submitting, submitLabel = "Create habit" }: HabitFormProps) {
  const latestSchedule = initial?.scheduleHistory?.at(-1)?.schedule;

  const {
    register,
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
      startDate: initial?.startDate ?? today,
      schedule: latestSchedule ?? { type: "daily", daysOfWeek: [], specificDates: [] },
    },
  });

  const type = watch("type");
  const icon = watch("icon");
  const color = watch("color");

  return (
    <form
      className="habit-form"
      onSubmit={handleSubmit((values) => onSubmit(values))}
    >
      <div className="field">
        <label>Name</label>
        <input className="input" placeholder="e.g. Morning run" {...register("name")} />
        {errors.name && <span className="error-text">{errors.name.message}</span>}
      </div>

      <div className="field">
        <label>Description (optional)</label>
        <textarea className="textarea" rows={2} placeholder="What does success look like?" {...register("description")} />
      </div>

      <div className="field">
        <label>Icon</label>
        <Controller
          control={control}
          name="icon"
          render={({ field }) => (
            <div className="icon-picker">
              {HABIT_ICONS.map((i) => (
                <button
                  key={i}
                  type="button"
                  className={"icon-swatch" + (icon === i ? " active" : "")}
                  style={{ color: icon === i ? color : undefined }}
                  onClick={() => field.onChange(i)}
                >
                  <DynamicIcon name={i} size={16} />
                </button>
              ))}
            </div>
          )}
        />
      </div>

      <div className="field">
        <label>Color</label>
        <div className="color-picker">
          {HABIT_COLORS.map((c) => (
            <label key={c} className="color-swatch-label">
              <input type="radio" value={c} {...register("color")} className="visually-hidden" />
              <span className={"color-swatch" + (color === c ? " active" : "")} style={{ background: c }} />
            </label>
          ))}
        </div>
      </div>

      <div className="two-col">
        <div className="field">
          <label>Category</label>
          <select className="select" {...register("category")}>
            {HABIT_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c[0].toUpperCase() + c.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Priority</label>
          <select className="select" {...register("priority")}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
      </div>

      <div className="field">
        <label>Type</label>
        <div className="segmented">
          <label className={type === "boolean" ? "active" : ""}>
            <input type="radio" value="boolean" {...register("type")} className="visually-hidden" />
            Yes / No
          </label>
          <label className={type === "numeric" ? "active" : ""}>
            <input type="radio" value="numeric" {...register("type")} className="visually-hidden" />
            Numeric target
          </label>
        </div>
      </div>

      {type === "numeric" && (
        <div className="two-col">
          <div className="field">
            <label>Target value</label>
            <input className="input" type="number" step="any" {...register("targetValue", { valueAsNumber: true })} />
          </div>
          <div className="field">
            <label>Unit</label>
            <input className="input" placeholder="glasses, minutes, steps…" {...register("targetUnit")} />
          </div>
        </div>
      )}

      <div className="two-col">
        <div className="field">
          <label>Start date</label>
          <input className="input" type="date" {...register("startDate")} />
        </div>
        <div className="field">
          <label>Reminder time (optional)</label>
          <input className="input" type="time" {...register("reminderTime")} />
        </div>
      </div>

      <div className="field">
        <label>Schedule</label>
        <Controller
          control={control}
          name="schedule"
          render={({ field }) => <ScheduleEditor value={field.value} onChange={field.onChange} />}
        />
      </div>

      <button className="btn btn-primary" type="submit" disabled={submitting} style={{ marginTop: 6 }}>
        {submitting ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}
