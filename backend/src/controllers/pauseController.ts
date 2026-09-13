import { Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync";
import { sendSuccess } from "../utils/ApiResponse";
import { PlanPause } from "../models/PlanPause";
import { Plan } from "../models/Plan";
import { Habit } from "../models/Habit";
import { ApiError } from "../utils/ApiError";
import { todayInTimezone } from "../utils/dateUtils";

export const listPauses = catchAsync(async (req: Request, res: Response) => {
  const today = todayInTimezone(req.user!.timezone);
  const pauses = await PlanPause.find({ userId: req.user!.id }).sort({ startDate: -1 });
  const withStatus = pauses.map((p) => ({
    ...p.toObject(),
    isActive: p.startDate <= today && p.endDate >= today,
    isUpcoming: p.startDate > today,
  }));
  sendSuccess(res, withStatus);
});

export const createPause = catchAsync(async (req: Request, res: Response) => {
  const { planId, habitId, startDate, endDate, reason } = req.body;

  if (planId) {
    const plan = await Plan.findOne({ _id: planId, userId: req.user!.id });
    if (!plan) throw ApiError.notFound("Plan not found", "PLAN_NOT_FOUND");
  }
  if (habitId) {
    const habit = await Habit.findOne({ _id: habitId, userId: req.user!.id });
    if (!habit) throw ApiError.notFound("Habit not found", "HABIT_NOT_FOUND");
  }

  const pause = await PlanPause.create({
    userId: req.user!.id,
    planId: planId ?? null,
    habitId: habitId ?? null,
    startDate,
    endDate,
    reason,
  });
  sendSuccess(res, pause, "Vacation mode scheduled", 201);
});

export const deletePause = catchAsync(async (req: Request, res: Response) => {
  const pause = await PlanPause.findOneAndDelete({ _id: req.params.id, userId: req.user!.id });
  if (!pause) throw ApiError.notFound("Pause not found", "PAUSE_NOT_FOUND");
  sendSuccess(res, null, "Pause removed");
});

/** Ends an in-progress pause today instead of at its originally scheduled end date. */
export const endPauseNow = catchAsync(async (req: Request, res: Response) => {
  const today = todayInTimezone(req.user!.timezone);
  const pause = await PlanPause.findOne({ _id: req.params.id, userId: req.user!.id });
  if (!pause) throw ApiError.notFound("Pause not found", "PAUSE_NOT_FOUND");

  if (pause.startDate >= today) {
    await pause.deleteOne();
    return sendSuccess(res, null, "Pause cancelled");
  }
  pause.endDate = today;
  await pause.save();
  sendSuccess(res, pause, "Resumed today");
});
