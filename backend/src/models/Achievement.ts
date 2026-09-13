import { Schema, Document } from "mongoose";
import { getModel } from "../utils/getModel";

export type AchievementCriteriaType =
  | "streak_days"
  | "total_checkins"
  | "total_checkins_category"
  | "total_focus_minutes"
  | "early_morning_checkins"
  | "journal_entries"
  | "tasks_completed"
  | "goals_completed"
  | "plan_created"
  | "perfect_week";

export interface IAchievementCriteria {
  type: AchievementCriteriaType;
  threshold: number;
  category?: string; // e.g. filter habit category for total_checkins_category
}

/** Static catalog of achievements. Seeded once; not user-specific. */
export interface IAchievement extends Document {
  key: string;
  title: string;
  description: string;
  icon: string;
  criteria: IAchievementCriteria;
  createdAt: Date;
  updatedAt: Date;
}

const achievementSchema = new Schema<IAchievement>(
  {
    key: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    icon: { type: String, required: true },
    criteria: {
      type: { type: String, required: true },
      threshold: { type: Number, required: true },
      category: { type: String },
    },
  },
  { timestamps: true }
);

export const Achievement = getModel<IAchievement>("Achievement", achievementSchema);
