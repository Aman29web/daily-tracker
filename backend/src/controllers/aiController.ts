import { Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync";
import { sendSuccess } from "../utils/ApiResponse";
import { AIService } from "../ai/AIService";
import { todayInTimezone } from "../utils/dateUtils";

export const dailyAnalysis = catchAsync(async (req: Request, res: Response) => {
  const date = (req.query.date as string) ?? todayInTimezone(req.user!.timezone);
  const analysis = await AIService.dailyAnalysis(req.user!.id, date, req.user!.timezone);
  sendSuccess(res, { analysis });
});

export const weeklyReview = catchAsync(async (req: Request, res: Response) => {
  const review = await AIService.weeklyReview(req.user!.id, req.user!.timezone);
  sendSuccess(res, { review });
});

export const habitRecommendations = catchAsync(async (req: Request, res: Response) => {
  const recommendations = await AIService.habitRecommendations(req.user!.id, req.user!.timezone);
  sendSuccess(res, { recommendations });
});

export const goalRecommendations = catchAsync(async (req: Request, res: Response) => {
  const recommendations = await AIService.goalRecommendations(req.user!.id, req.user!.timezone);
  sendSuccess(res, { recommendations });
});

export const journalSummary = catchAsync(async (req: Request, res: Response) => {
  const { start, end } = req.query as unknown as { start: string; end: string };
  const summary = await AIService.journalSummary(req.user!.id, start, end);
  sendSuccess(res, { summary });
});

export const ask = catchAsync(async (req: Request, res: Response) => {
  const answer = await AIService.ask(req.user!.id, req.body.question, req.user!.timezone);
  sendSuccess(res, { answer });
});
