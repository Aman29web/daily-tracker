import { Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync";
import { sendSuccess } from "../utils/ApiResponse";
import * as analyticsService from "../services/analyticsService";
import { UserSettings } from "../models/UserSettings";
import { isValidDateString, todayInTimezone } from "../utils/dateUtils";
import { ApiError } from "../utils/ApiError";

export const getDaily = catchAsync(async (req: Request, res: Response) => {
  const date = (req.query.date as string) ?? todayInTimezone(req.user!.timezone);
  if (!isValidDateString(date)) throw ApiError.badRequest("Invalid date", "INVALID_DATE");
  const data = await analyticsService.getDailyAnalytics(req.user!.id, date, req.user!.timezone);
  sendSuccess(res, data);
});

export const getWeekly = catchAsync(async (req: Request, res: Response) => {
  const date = (req.query.date as string) ?? todayInTimezone(req.user!.timezone);
  if (!isValidDateString(date)) throw ApiError.badRequest("Invalid date", "INVALID_DATE");
  const settings = await UserSettings.findOne({ userId: req.user!.id });
  const report = await analyticsService.getWeeklyReport(req.user!.id, date, req.user!.timezone, settings?.weekStartsOn ?? 1);
  sendSuccess(res, report);
});

export const getMonthly = catchAsync(async (req: Request, res: Response) => {
  const month = (req.query.month as string) ?? todayInTimezone(req.user!.timezone).slice(0, 7);
  const anchor = `${month}-15`;
  const report = await analyticsService.getMonthlyReport(req.user!.id, anchor, req.user!.timezone);
  sendSuccess(res, report);
});

export const getInsights = catchAsync(async (req: Request, res: Response) => {
  const insights = await analyticsService.getInsights(req.user!.id, req.user!.timezone);
  sendSuccess(res, insights);
});

export const getProfile = catchAsync(async (req: Request, res: Response) => {
  const profile = await analyticsService.getProductivityProfile(req.user!.id, req.user!.timezone);
  sendSuccess(res, profile);
});
