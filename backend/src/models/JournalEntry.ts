import { Schema, Document, Types } from "mongoose";
import { getModel } from "../utils/getModel";
import { MOODS, Mood } from "../types/enums";

export interface IJournalEntry extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  date: string;
  wentWell?: string;
  wentWrong?: string;
  learned?: string;
  improveTomorrow?: string;
  content?: string;
  mood?: Mood;
  energy?: number;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const journalEntrySchema = new Schema<IJournalEntry>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    date: { type: String, required: true },
    wentWell: { type: String, maxlength: 3000 },
    wentWrong: { type: String, maxlength: 3000 },
    learned: { type: String, maxlength: 3000 },
    improveTomorrow: { type: String, maxlength: 3000 },
    content: { type: String, maxlength: 5000 },
    mood: { type: String, enum: MOODS },
    energy: { type: Number, min: 0, max: 100 },
    tags: { type: [String], default: [] },
  },
  { timestamps: true }
);

journalEntrySchema.index({ userId: 1, date: 1 }, { unique: true });
journalEntrySchema.index({ userId: 1, tags: 1 });

export const JournalEntry = getModel<IJournalEntry>("JournalEntry", journalEntrySchema);
