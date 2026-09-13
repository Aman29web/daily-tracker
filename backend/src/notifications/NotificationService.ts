import { Notification, INotification } from "../models/Notification";
import { NotificationChannel, NotificationType } from "../types/enums";
import { getProvider } from "./NotificationProvider";
import { logger } from "../config/logger";

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  channel?: NotificationChannel;
  scheduledFor?: Date;
}

/**
 * Channel-agnostic notification API. A React Native client and the web
 * client both read the exact same `GET /api/notifications` shape - nothing
 * here assumes a browser. Delivery for push/email is behind the
 * NotificationProvider interface so a real provider can be swapped in
 * without touching this service or any route.
 */
export const NotificationService = {
  async create(input: CreateNotificationInput): Promise<INotification> {
    return Notification.create({
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      data: input.data,
      channel: input.channel ?? "in_app",
      scheduledFor: input.scheduledFor ?? new Date(),
      status: "pending",
    });
  },

  /**
   * Avoids spamming the same reminder twice in one day. `dedupeKey` narrows
   * beyond type+date for reminders that fire per-entity (e.g. one habit
   * reminder per habit per day) by matching against `data`.
   */
  async existsToday(
    userId: string,
    type: NotificationType,
    dateStr: string,
    dedupeKey?: Record<string, unknown>
  ): Promise<boolean> {
    const start = new Date(`${dateStr}T00:00:00.000Z`);
    const end = new Date(`${dateStr}T23:59:59.999Z`);
    const query: Record<string, unknown> = { userId, type, createdAt: { $gte: start, $lte: end } };
    if (dedupeKey) {
      for (const [key, value] of Object.entries(dedupeKey)) query[`data.${key}`] = value;
    }
    const existing = await Notification.findOne(query);
    return !!existing;
  },

  async listForUser(userId: string, page: number, limit: number, unreadOnly = false) {
    const query: Record<string, unknown> = { userId };
    if (unreadOnly) query.readAt = null;
    const [items, total, unreadCount] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Notification.countDocuments(query),
      Notification.countDocuments({ userId, readAt: null }),
    ]);
    return { items, total, unreadCount };
  },

  async markRead(userId: string, id: string): Promise<INotification | null> {
    return Notification.findOneAndUpdate({ _id: id, userId }, { $set: { readAt: new Date() } }, { new: true });
  },

  async markAllRead(userId: string): Promise<void> {
    await Notification.updateMany({ userId, readAt: null }, { $set: { readAt: new Date() } });
  },

  async delete(userId: string, id: string): Promise<void> {
    await Notification.deleteOne({ _id: id, userId });
  },

  /** Cron target: attempts delivery for every due, pending notification via its channel's provider. */
  async dispatchDue(): Promise<number> {
    const due = await Notification.find({ status: "pending", scheduledFor: { $lte: new Date() } }).limit(500);
    let sent = 0;
    for (const notification of due) {
      try {
        await getProvider(notification.channel).send(notification);
        notification.status = "sent";
        notification.sentAt = new Date();
        await notification.save();
        sent += 1;
      } catch (err) {
        logger.error("Notification dispatch failed", { id: notification._id.toString(), err });
        notification.status = "failed";
        await notification.save();
      }
    }
    return sent;
  },
};
