import { Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync";
import { sendSuccess, buildPagination } from "../utils/ApiResponse";
import * as habitService from "../services/habitService";
import { todayInTimezone } from "../utils/dateUtils";

export const createHabit = catchAsync(async (req: Request, res: Response) => {
  const habit = await habitService.createHabit(req.user!.id, req.body);
  sendSuccess(res, habit, "Habit created", 201);
});

export const listHabits = catchAsync(async (req: Request, res: Response) => {
  const { page, limit, category, planId, isActive, search } = req.query as unknown as {
    page: number;
    limit: number;
    category?: string;
    planId?: string;
    isActive?: boolean;
    search?: string;
  };
  const { items, total } = await habitService.listHabitsForUser(
    req.user!.id,
    { category, planId, isActive, search },
    page,
    limit,
    req.user!.timezone
  );
  sendSuccess(res, items, "Habits retrieved", 200, { pagination: buildPagination(page, limit, total) });
});

export const getHabit = catchAsync(async (req: Request, res: Response) => {
  const result = await habitService.getHabitWithStats(req.user!.id, req.params.id, req.user!.timezone);
  sendSuccess(res, result);
});

export const updateHabit = catchAsync(async (req: Request, res: Response) => {
  const habit = await habitService.updateHabit(req.user!.id, req.params.id, req.body);
  sendSuccess(res, habit, "Habit updated");
});

export const updateHabitSchedule = catchAsync(async (req: Request, res: Response) => {
  const { schedule, effectiveFrom } = req.body;
  const habit = await habitService.updateHabitSchedule(
    req.user!.id,
    req.params.id,
    schedule,
    effectiveFrom ?? todayInTimezone(req.user!.timezone),
    req.user!.timezone
  );
  sendSuccess(res, habit, "Schedule updated");
});

export const deleteHabit = catchAsync(async (req: Request, res: Response) => {
  await habitService.deleteHabit(req.user!.id, req.params.id);
  sendSuccess(res, null, "Habit deleted");
});

export const checkIn = catchAsync(async (req: Request, res: Response) => {
  const result = await habitService.performCheckIn(req.user!.id, req.params.id, req.body, req.user!.timezone);
  sendSuccess(res, result, "Check-in recorded");
});

export const getHabitRange = catchAsync(async (req: Request, res: Response) => {
  const { start, end } = req.query as unknown as { start: string; end: string };
  const statuses = await habitService.getHabitRangeStatuses(req.user!.id, req.params.id, start, end, req.user!.timezone);
  sendSuccess(res, statuses);
});

export const getHabitStats = catchAsync(async (req: Request, res: Response) => {
  const result = await habitService.getHabitWithStats(req.user!.id, req.params.id, req.user!.timezone);
  sendSuccess(res, { streak: result.streak, today: result.today });
});
