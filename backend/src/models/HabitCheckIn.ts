import { Schema, Document, Types } from "mongoose";
import { getModel } from "../utils/getModel";

/**
 * Persisted only for days the user (or a system job) actually acted on:
 * completed, skipped, or explicitly marked missed. Days with no record are
 * resolved on read by the schedule/pause engine (see services/dayStatus.ts) -
 * this keeps the collection small and, crucially, means editing a habit's
 * schedule or pausing a plan later never has to rewrite check-in rows.
 */
export interface IHabitCheckIn extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  habitId: Types.ObjectId;
  date: string; // YYYY-MM-DD in the user's timezone at the time of check-in
  /**
   * For boolean habits this is always set directly by the user's action.
   * For numeric habits it is only set when the user explicitly skips/marks
   * missed - ordinary incremental progress leaves it undefined and
   * completion is derived by comparing `value` to the habit's target
   * (see services/dayStatusService.ts), since the day isn't "over" yet.
   */
  status?: "completed" | "skipped" | "missed";
  value?: number; // for numeric habits, progress toward target.value
  note?: string;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const habitCheckInSchema = new Schema<IHabitCheckIn>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    habitId: { type: Schema.Types.ObjectId, ref: "Habit", required: true, index: true },
    date: { type: String, required: true },
    status: { type: String, enum: ["completed", "skipped", "missed"] },
    value: { type: Number },
    note: { type: String, maxlength: 500 },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

habitCheckInSchema.index({ habitId: 1, date: 1 }, { unique: true });
habitCheckInSchema.index({ userId: 1, date: 1 });

export const HabitCheckIn = getModel<IHabitCheckIn>("HabitCheckIn", habitCheckInSchema);
