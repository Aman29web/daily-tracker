import { Schema, Document, Types } from "mongoose";
import { getModel } from "../utils/getModel";

export interface IUserAchievement extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  achievementKey: string;
  progress: number;
  unlockedAt: Date;
  createdAt: Date;
}

const userAchievementSchema = new Schema<IUserAchievement>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    achievementKey: { type: String, required: true },
    progress: { type: Number, default: 100 },
    unlockedAt: { type: Date, default: () => new Date() },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

userAchievementSchema.index({ userId: 1, achievementKey: 1 }, { unique: true });

export const UserAchievement = getModel<IUserAchievement>("UserAchievement", userAchievementSchema);
