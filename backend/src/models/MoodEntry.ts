import { Schema, Document, Types } from "mongoose";
import { getModel } from "../utils/getModel";
import { MOODS, Mood } from "../types/enums";

/** Canonical source of truth for a day's mood/energy, used by analytics. */
export interface IMoodEntry extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  date: string;
  mood: Mood;
  energy: number; // 0-100
  createdAt: Date;
  updatedAt: Date;
}

const moodEntrySchema = new Schema<IMoodEntry>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    date: { type: String, required: true },
    mood: { type: String, enum: MOODS, required: true },
    energy: { type: Number, required: true, min: 0, max: 100 },
  },
  { timestamps: true }
);

moodEntrySchema.index({ userId: 1, date: 1 }, { unique: true });

export const MoodEntry = getModel<IMoodEntry>("MoodEntry", moodEntrySchema);
