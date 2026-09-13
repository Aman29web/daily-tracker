import { Schema, Document, Types } from "mongoose";
import { getModel } from "../utils/getModel";
import { HABIT_TYPES, HabitType, SCHEDULE_TYPES, ScheduleType } from "../types/enums";

/**
 * A single schedule definition. Interpretation depends on `type`:
 *  - daily:          every day
 *  - weekdays:       only on `daysOfWeek` (0=Sun..6=Sat)
 *  - x_per_week:     `timesPerPeriod` occurrences per week, user's choice which days
 *  - x_per_month:    `timesPerPeriod` occurrences per month, user's choice which days
 *  - specific_dates:  only on the literal `specificDates` ("YYYY-MM-DD") list
 */
export interface IHabitSchedule {
  type: ScheduleType;
  daysOfWeek: number[];
  timesPerPeriod?: number;
  specificDates: string[];
}

const habitScheduleSchema = new Schema<IHabitSchedule>(
  {
    type: { type: String, enum: SCHEDULE_TYPES, required: true },
    daysOfWeek: { type: [Number], default: [] },
    timesPerPeriod: { type: Number },
    specificDates: { type: [String], default: [] },
  },
  { _id: false }
);

/**
 * Versioned schedule history. `effectiveFrom` is inclusive; `effectiveTo` is
 * inclusive and null/undefined means "still in effect". Editing a habit's
 * schedule closes the current version and opens a new one starting today
 * (or a chosen future date) so that occurrence/streak computation for past
 * dates keeps using the schedule that was actually active then — history is
 * never rewritten.
 */
export interface IHabitScheduleVersion {
  schedule: IHabitSchedule;
  effectiveFrom: string;
  effectiveTo: string | null;
}

const habitScheduleVersionSchema = new Schema<IHabitScheduleVersion>(
  {
    schedule: { type: habitScheduleSchema, required: true },
    effectiveFrom: { type: String, required: true },
    effectiveTo: { type: String, default: null },
  },
  { _id: false }
);

export interface IHabitTarget {
  value: number;
  unit: string;
}

export interface IHabit extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  name: string;
  description?: string;
  icon: string;
  color: string;
  category: string;
  type: HabitType;
  target?: IHabitTarget;
  priority: "low" | "medium" | "high";
  reminderTime?: string;
  startDate: string;
  endDate?: string | null;
  isActive: boolean;
  planId?: Types.ObjectId | null;
  scheduleHistory: IHabitScheduleVersion[];
  createdAt: Date;
  updatedAt: Date;

  currentSchedule(dateStr: string): IHabitSchedule | null;
}

const habitSchema = new Schema<IHabit>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, trim: true, maxlength: 500 },
    icon: { type: String, default: "target" },
    color: { type: String, default: "#6366f1" },
    category: { type: String, default: "general", trim: true },
    type: { type: String, enum: HABIT_TYPES, default: "boolean" },
    target: {
      value: { type: Number },
      unit: { type: String },
    },
    priority: { type: String, enum: ["low", "medium", "high"], default: "medium" },
    reminderTime: { type: String },
    startDate: { type: String, required: true },
    endDate: { type: String, default: null },
    isActive: { type: Boolean, default: true },
    planId: { type: Schema.Types.ObjectId, ref: "Plan", default: null, index: true },
    scheduleHistory: { type: [habitScheduleVersionSchema], default: [] },
  },
  { timestamps: true }
);

habitSchema.index({ userId: 1, isActive: 1 });
habitSchema.index({ userId: 1, planId: 1 });

/** Returns the schedule version effective on the given date, or null if none applies. */
habitSchema.methods.currentSchedule = function (dateStr: string): IHabitSchedule | null {
  const version = (this.scheduleHistory as IHabitScheduleVersion[]).find(
    (v) => v.effectiveFrom <= dateStr && (!v.effectiveTo || v.effectiveTo >= dateStr)
  );
  return version ? version.schedule : null;
};

export const Habit = getModel<IHabit>("Habit", habitSchema);
