import { Schema, Document, Types } from "mongoose";
import { getModel } from "../utils/getModel";
import { GOAL_PROGRESS_SOURCES, GoalProgressSource, GOAL_STATUSES, GoalStatus } from "../types/enums";

export interface IGoal extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  title: string;
  description?: string;
  category: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  progressSource: GoalProgressSource;
  linkedHabitIds: Types.ObjectId[];
  deadline?: string | null;
  status: GoalStatus;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date | null;
}

const goalSchema = new Schema<IGoal>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 150 },
    description: { type: String, trim: true, maxlength: 1000 },
    category: { type: String, default: "general" },
    targetValue: { type: Number, required: true, min: 0 },
    currentValue: { type: Number, default: 0, min: 0 },
    unit: { type: String, default: "units" },
    progressSource: { type: String, enum: GOAL_PROGRESS_SOURCES, default: "manual" },
    linkedHabitIds: [{ type: Schema.Types.ObjectId, ref: "Habit" }],
    deadline: { type: String, default: null },
    status: { type: String, enum: GOAL_STATUSES, default: "active", index: true },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

goalSchema.index({ userId: 1, status: 1 });

export const Goal = getModel<IGoal>("Goal", goalSchema);
