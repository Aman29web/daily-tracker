import { Schema, Document, Types } from "mongoose";
import { getModel } from "../utils/getModel";
import {
  NOTIFICATION_CHANNELS,
  NotificationChannel,
  NOTIFICATION_STATUSES,
  NotificationStatus,
  NOTIFICATION_TYPES,
  NotificationType,
} from "../types/enums";

/**
 * Channel-agnostic notification record. The web app polls/reads `in_app`
 * rows directly; `push`/`email` rows are the same shape so a future React
 * Native client or an email worker can consume the identical API
 * (see notifications/NotificationService.ts) without any backend changes.
 */
export interface INotification extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  type: NotificationType;
  channel: NotificationChannel;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  status: NotificationStatus;
  scheduledFor: Date;
  sentAt?: Date | null;
  readAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, enum: NOTIFICATION_TYPES, required: true },
    channel: { type: String, enum: NOTIFICATION_CHANNELS, default: "in_app" },
    title: { type: String, required: true },
    body: { type: String, required: true },
    data: { type: Schema.Types.Mixed },
    status: { type: String, enum: NOTIFICATION_STATUSES, default: "pending", index: true },
    scheduledFor: { type: Date, required: true },
    sentAt: { type: Date, default: null },
    readAt: { type: Date, default: null },
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, status: 1, scheduledFor: 1 });
notificationSchema.index({ userId: 1, createdAt: -1 });

export const Notification = getModel<INotification>("Notification", notificationSchema);
