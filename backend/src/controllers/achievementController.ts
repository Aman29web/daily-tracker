import { Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync";
import { sendSuccess } from "../utils/ApiResponse";
import * as achievementService from "../services/achievementService";

export const listAchievements = catchAsync(async (req: Request, res: Response) => {
  const achievements = await achievementService.getAchievementsForUser(req.user!.id, req.user!.timezone);
  sendSuccess(res, achievements);
});
