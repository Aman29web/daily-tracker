import { Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync";
import { sendSuccess } from "../utils/ApiResponse";
import * as calendarService from "../services/calendarService";
import { ApiError } from "../utils/ApiError";
import { isValidDateString } from "../utils/dateUtils";

export const getRange = catchAsync(async (req: Request, res: Response) => {
  const { start, end } = req.query as { start?: string; end?: string };
  if (!start || !end || !isValidDateString(start) || !isValidDateString(end)) {
    throw ApiError.badRequest("start and end (YYYY-MM-DD) are required", "INVALID_RANGE");
  }
  const days = await calendarService.getCalendarRange(req.user!.id, start, end, req.user!.timezone);
  sendSuccess(res, days);
});

export const getDay = catchAsync(async (req: Request, res: Response) => {
  const { date } = req.params;
  if (!isValidDateString(date)) throw ApiError.badRequest("Invalid date", "INVALID_DATE");
  const detail = await calendarService.getDayDetail(req.user!.id, date, req.user!.timezone);
  sendSuccess(res, detail);
});
