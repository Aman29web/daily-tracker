import { Schema, Document, Types } from "mongoose";
import { getModel } from "../utils/getModel";

/**
 * A cached, recomputable rollup of one user's one day, used to make
 * calendar/heatmap/analytics reads fast without re-deriving habit status
 * and re-aggregating tasks/focus/journal on every request. Always safe to
 * regenerate from source collections (see services/dailySummaryService.ts) -
 * never treated as the source of truth for anything.
 */
export interface IDailySummary extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  date: string;
  productivityScore: number;
  habitsScheduled: number;
  habitsCompleted: number;
  habitsMissed: number;
  habitsSkipped: number;
  habitsPaused: number;
  habitsRestDay: number;
  tasksTotal: number;
  tasksCompleted: number;
  focusMinutes: number;
  focusSessions: number;
  mood?: string | null;
  energy?: number | null;
  journalCompleted: boolean;
  top3Total: number;
  top3Completed: number;
  isFinal: boolean; // true once the day has fully passed and won't be recomputed by live reads
  generatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const dailySummarySchema = new Schema<IDailySummary>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    date: { type: String, required: true },
    productivityScore: { type: Number, default: 0 },
    habitsScheduled: { type: Number, default: 0 },
    habitsCompleted: { type: Number, default: 0 },
    habitsMissed: { type: Number, default: 0 },
    habitsSkipped: { type: Number, default: 0 },
    habitsPaused: { type: Number, default: 0 },
    habitsRestDay: { type: Number, default: 0 },
    tasksTotal: { type: Number, default: 0 },
    tasksCompleted: { type: Number, default: 0 },
    focusMinutes: { type: Number, default: 0 },
    focusSessions: { type: Number, default: 0 },
    mood: { type: String, default: null },
    energy: { type: Number, default: null },
    journalCompleted: { type: Boolean, default: false },
    top3Total: { type: Number, default: 0 },
    top3Completed: { type: Number, default: 0 },
    isFinal: { type: Boolean, default: false },
    generatedAt: { type: Date, default: () => new Date() },
  },
  { timestamps: true }
);

dailySummarySchema.index({ userId: 1, date: 1 }, { unique: true });

export const DailySummary = getModel<IDailySummary>("DailySummary", dailySummarySchema);
