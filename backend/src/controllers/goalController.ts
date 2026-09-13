import { Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync";
import { buildPagination, sendSuccess } from "../utils/ApiResponse";
import * as goalService from "../services/goalService";
import { evaluateAchievementsForUser } from "../services/achievementService";
import { todayInTimezone } from "../utils/dateUtils";

export const listGoals = catchAsync(async (req: Request, res: Response) => {
  const { page, limit, status, category } = req.query as unknown as {
    page: number;
    limit: number;
    status?: string;
    category?: string;
  };
  const { items, total } = await goalService.listGoals(req.user!.id, { status, category }, page, limit);
  const today = todayInTimezone(req.user!.timezone);
  const withPace = items.map((g) => ({ ...g.toObject(), pace: goalService.computeGoalPace(g, today) }));
  sendSuccess(res, withPace, "Goals retrieved", 200, { pagination: buildPagination(page, limit, total) });
});

export const getGoal = catchAsync(async (req: Request, res: Response) => {
  const goal = await goalService.getOwnedGoal(req.user!.id, req.params.id);
  const today = todayInTimezone(req.user!.timezone);
  sendSuccess(res, { ...goal.toObject(), pace: goalService.computeGoalPace(goal, today) });
});

export const createGoal = catchAsync(async (req: Request, res: Response) => {
  const goal = await goalService.createGoal(req.user!.id, req.body);
  sendSuccess(res, goal, "Goal created", 201);
});

export const updateGoal = catchAsync(async (req: Request, res: Response) => {
  const goal = await goalService.updateGoal(req.user!.id, req.params.id, req.body);
  if (req.body.status === "completed") await evaluateAchievementsForUser(req.user!.id, req.user!.timezone);
  sendSuccess(res, goal, "Goal updated");
});

export const setGoalProgress = catchAsync(async (req: Request, res: Response) => {
  const goal = await goalService.setGoalProgress(req.user!.id, req.params.id, req.body.currentValue);
  if (goal.status === "completed") await evaluateAchievementsForUser(req.user!.id, req.user!.timezone);
  sendSuccess(res, goal, "Progress updated");
});

export const deleteGoal = catchAsync(async (req: Request, res: Response) => {
  await goalService.deleteGoal(req.user!.id, req.params.id);
  sendSuccess(res, null, "Goal deleted");
});
