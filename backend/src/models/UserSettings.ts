import { Schema, Document, Types } from "mongoose";
import { getModel } from "../utils/getModel";

export interface IProductivityWeights {
  habits: number;
  tasks: number;
  focus: number;
  top3: number;
}

export interface INotificationPreferences {
  morningReminder: { enabled: boolean; time: string };
  habitReminders: boolean;
  taskReminders: boolean;
  nightlyReview: { enabled: boolean; time: string };
  streakRisk: boolean;
  goalReminders: boolean;
  weeklyReport: boolean;
  achievementAlerts: boolean;
  pushEnabled: boolean;
  emailEnabled: boolean;
}

export interface IUserSettings extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  theme: "light" | "dark" | "system";
  weekStartsOn: number; // 0 = Sunday, 1 = Monday
  productivityWeights: IProductivityWeights;
  notificationPreferences: INotificationPreferences;
  aiEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userSettingsSchema = new Schema<IUserSettings>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    theme: { type: String, enum: ["light", "dark", "system"], default: "system" },
    weekStartsOn: { type: Number, default: 1, min: 0, max: 6 },
    productivityWeights: {
      habits: { type: Number, default: 40 },
      tasks: { type: Number, default: 25 },
      focus: { type: Number, default: 20 },
      top3: { type: Number, default: 15 },
    },
    notificationPreferences: {
      morningReminder: {
        enabled: { type: Boolean, default: true },
        time: { type: String, default: "07:00" },
      },
      habitReminders: { type: Boolean, default: true },
      taskReminders: { type: Boolean, default: true },
      nightlyReview: {
        enabled: { type: Boolean, default: true },
        time: { type: String, default: "21:00" },
      },
      streakRisk: { type: Boolean, default: true },
      goalReminders: { type: Boolean, default: true },
      weeklyReport: { type: Boolean, default: true },
      achievementAlerts: { type: Boolean, default: true },
      pushEnabled: { type: Boolean, default: false },
      emailEnabled: { type: Boolean, default: false },
    },
    aiEnabled: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const UserSettings = getModel<IUserSettings>("UserSettings", userSettingsSchema);
