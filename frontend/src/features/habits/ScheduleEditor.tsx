import { HabitSchedule, ScheduleType } from "../../types";
import "./ScheduleEditor.css";

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

const SCHEDULE_OPTIONS: { value: ScheduleType; label: string; hint: string }[] = [
  { value: "daily", label: "Every day", hint: "No days off" },
  { value: "weekdays", label: "Specific days", hint: "Pick weekdays, e.g. Mon/Wed/Fri" },
  { value: "x_per_week", label: "X times per week", hint: "Flexible — any days" },
  { value: "x_per_month", label: "X times per month", hint: "Flexible — any days" },
  { value: "specific_dates", label: "Specific dates", hint: "One-off or custom dates" },
];

interface ScheduleEditorProps {
  value: HabitSchedule;
  onChange: (value: HabitSchedule) => void;
}

export default function ScheduleEditor({ value, onChange }: ScheduleEditorProps) {
  const toggleDay = (day: number) => {
    const days = value.daysOfWeek.includes(day) ? value.daysOfWeek.filter((d) => d !== day) : [...value.daysOfWeek, day].sort();
    onChange({ ...value, daysOfWeek: days });
  };

  return (
    <div className="schedule-editor">
      <div className="schedule-type-grid">
        {SCHEDULE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            className={"schedule-type-btn" + (value.type === opt.value ? " active" : "")}
            onClick={() =>
              onChange({
                type: opt.value,
                daysOfWeek: opt.value === "weekdays" ? value.daysOfWeek : [],
                timesPerPeriod: opt.value === "x_per_week" || opt.value === "x_per_month" ? value.timesPerPeriod ?? 3 : undefined,
                specificDates: opt.value === "specific_dates" ? value.specificDates : [],
              })
            }
          >
            <strong>{opt.label}</strong>
            <span>{opt.hint}</span>
          </button>
        ))}
      </div>

      {value.type === "weekdays" && (
        <div className="schedule-days-row">
          {DAY_LABELS.map((label, idx) => (
            <button
              key={idx}
              type="button"
              className={"schedule-day-chip" + (value.daysOfWeek.includes(idx) ? " active" : "")}
              onClick={() => toggleDay(idx)}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {(value.type === "x_per_week" || value.type === "x_per_month") && (
        <div className="field" style={{ maxWidth: 220 }}>
          <label>Times per {value.type === "x_per_week" ? "week" : "month"}</label>
          <input
            type="number"
            min={1}
            max={31}
            className="input"
            value={value.timesPerPeriod ?? 3}
            onChange={(e) => onChange({ ...value, timesPerPeriod: Number(e.target.value) })}
          />
        </div>
      )}

      {value.type === "specific_dates" && (
        <div className="field">
          <label>Dates (comma separated, YYYY-MM-DD)</label>
          <input
            className="input"
            placeholder="2025-01-01, 2025-02-14"
            defaultValue={value.specificDates.join(", ")}
            onBlur={(e) =>
              onChange({
                ...value,
                specificDates: e.target.value
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean),
              })
            }
          />
        </div>
      )}
    </div>
  );
}
