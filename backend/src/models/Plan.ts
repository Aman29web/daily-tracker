import { Schema, Document, Types } from "mongoose";
import { getModel } from "../utils/getModel";

export interface IPlan extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  name: string;
  description?: string;
  category: string;
  icon: string;
  color: string;
  isActive: boolean;
  isArchived: boolean;
  isTemplate: boolean;
  sourceTemplateId?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const planSchema = new Schema<IPlan>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, trim: true, maxlength: 500 },
    category: { type: String, default: "general" },
    icon: { type: String, default: "layers" },
    color: { type: String, default: "#6366f1" },
    isActive: { type: Boolean, default: true },
    isArchived: { type: Boolean, default: false },
    isTemplate: { type: Boolean, default: false },
    sourceTemplateId: { type: Schema.Types.ObjectId, ref: "Plan", default: null },
  },
  { timestamps: true }
);

planSchema.index({ userId: 1, isArchived: 1 });

export const Plan = getModel<IPlan>("Plan", planSchema);
