import { Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync";
import { buildPagination, sendSuccess } from "../utils/ApiResponse";
import { NotificationService } from "../notifications/NotificationService";

export const listNotifications = catchAsync(async (req: Request, res: Response) => {
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 20);
  const unreadOnly = req.query.unreadOnly === "true";
  const { items, total, unreadCount } = await NotificationService.listForUser(req.user!.id, page, limit, unreadOnly);
  sendSuccess(res, items, "Notifications retrieved", 200, { pagination: buildPagination(page, limit, total), unreadCount });
});

export const markRead = catchAsync(async (req: Request, res: Response) => {
  const notification = await NotificationService.markRead(req.user!.id, req.params.id);
  sendSuccess(res, notification, "Marked as read");
});

export const markAllRead = catchAsync(async (req: Request, res: Response) => {
  await NotificationService.markAllRead(req.user!.id);
  sendSuccess(res, null, "All notifications marked read");
});

export const deleteNotification = catchAsync(async (req: Request, res: Response) => {
  await NotificationService.delete(req.user!.id, req.params.id);
  sendSuccess(res, null, "Notification deleted");
});
