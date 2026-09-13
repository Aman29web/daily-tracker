import { Schema, Document, Types } from "mongoose";
import { getModel } from "../utils/getModel";
import { FOCUS_MODES, FocusMode, FOCUS_STATUSES, FocusStatus } from "../types/enums";

export interface IFocusSession extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  mode: FocusMode;
  plannedDuration: number; // minutes
  actualDuration: number; // minutes, accumulated
  startTime: Date;
  endTime?: Date | null;
  /** Set whenever the session enters "running" (start or resume); used to compute the next elapsed chunk to add to actualDuration on pause/complete. */
  lastResumedAt?: Date | null;
  status: FocusStatus;
  taskId?: Types.ObjectId | null;
  goalId?: Types.ObjectId | null;
  category: string;
  date: string; // YYYY-MM-DD the session started, in user's timezone
  createdAt: Date;
  updatedAt: Date;
}

const focusSessionSchema = new Schema<IFocusSession>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    mode: { type: String, enum: FOCUS_MODES, default: "25" },
    plannedDuration: { type: Number, required: true },
    actualDuration: { type: Number, default: 0 },
    startTime: { type: Date, required: true },
    endTime: { type: Date, default: null },
    lastResumedAt: { type: Date, default: null },
    status: { type: String, enum: FOCUS_STATUSES, default: "running", index: true },
    taskId: { type: Schema.Types.ObjectId, ref: "Task", default: null },
    goalId: { type: Schema.Types.ObjectId, ref: "Goal", default: null },
    category: { type: String, default: "general" },
    date: { type: String, required: true, index: true },
  },
  { timestamps: true }
);

focusSessionSchema.index({ userId: 1, date: 1 });
focusSessionSchema.index({ userId: 1, status: 1 });

export const FocusSession = getModel<IFocusSession>("FocusSession", focusSessionSchema);
