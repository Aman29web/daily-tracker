import { Schema, Document, Types } from "mongoose";
import { getModel } from "../utils/getModel";
import { TASK_PRIORITIES, TaskPriority, TASK_STATUSES, TaskStatus } from "../types/enums";

export interface ITask extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  title: string;
  description?: string;
  priority: TaskPriority;
  dueDate?: string | null;
  status: TaskStatus;
  category: string;
  estimatedDuration?: number; // minutes
  actualDuration?: number; // minutes
  goalId?: Types.ObjectId | null;
  planId?: Types.ObjectId | null;
  isTop3: boolean;
  top3Date?: string | null;
  order: number;
  completedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const taskSchema = new Schema<ITask>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 2000 },
    priority: { type: String, enum: TASK_PRIORITIES, default: "medium" },
    dueDate: { type: String, default: null },
    status: { type: String, enum: TASK_STATUSES, default: "todo", index: true },
    category: { type: String, default: "general" },
    estimatedDuration: { type: Number },
    actualDuration: { type: Number },
    goalId: { type: Schema.Types.ObjectId, ref: "Goal", default: null, index: true },
    planId: { type: Schema.Types.ObjectId, ref: "Plan", default: null },
    isTop3: { type: Boolean, default: false },
    top3Date: { type: String, default: null, index: true },
    order: { type: Number, default: 0 },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

taskSchema.index({ userId: 1, status: 1, dueDate: 1 });
taskSchema.index({ userId: 1, top3Date: 1 });

export const Task = getModel<ITask>("Task", taskSchema);
