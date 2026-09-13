import { Schema, Document, Types } from "mongoose";
import { getModel } from "../utils/getModel";

/**
 * A vacation/pause window. Exactly one of `planId` / `habitId` is set:
 * plan-level pauses apply to every habit belonging to that plan, habit-level
 * pauses apply to a single habit. Dates are inclusive "YYYY-MM-DD".
 */
export interface IPlanPause extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  planId?: Types.ObjectId | null;
  habitId?: Types.ObjectId | null;
  startDate: string;
  endDate: string;
  reason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const planPauseSchema = new Schema<IPlanPause>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    planId: { type: Schema.Types.ObjectId, ref: "Plan", default: null, index: true },
    habitId: { type: Schema.Types.ObjectId, ref: "Habit", default: null, index: true },
    startDate: { type: String, required: true },
    endDate: { type: String, required: true },
    reason: { type: String, maxlength: 200 },
  },
  { timestamps: true }
);

planPauseSchema.index({ userId: 1, startDate: 1, endDate: 1 });

export const PlanPause = getModel<IPlanPause>("PlanPause", planPauseSchema);
