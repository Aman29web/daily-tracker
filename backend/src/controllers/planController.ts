import { Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync";
import { buildPagination, sendSuccess } from "../utils/ApiResponse";
import * as planService from "../services/planService";
import { evaluateAchievementsForUser } from "../services/achievementService";

export const listPlans = catchAsync(async (req: Request, res: Response) => {
  const { page, limit, isArchived, isTemplate } = req.query as unknown as {
    page: number;
    limit: number;
    isArchived?: boolean;
    isTemplate?: boolean;
  };
  const { items, total } = await planService.listPlans(req.user!.id, { isArchived, isTemplate }, page, limit);
  sendSuccess(res, items, "Plans retrieved", 200, { pagination: buildPagination(page, limit, total) });
});

export const createPlan = catchAsync(async (req: Request, res: Response) => {
  const plan = await planService.createPlan(req.user!.id, req.body);
  await evaluateAchievementsForUser(req.user!.id, req.user!.timezone);
  sendSuccess(res, plan, "Plan created", 201);
});

export const updatePlan = catchAsync(async (req: Request, res: Response) => {
  const plan = await planService.updatePlan(req.user!.id, req.params.id, req.body);
  sendSuccess(res, plan, "Plan updated");
});

export const activatePlan = catchAsync(async (req: Request, res: Response) => {
  const plan = await planService.setPlanActive(req.user!.id, req.params.id, true);
  sendSuccess(res, plan, "Plan activated");
});

export const deactivatePlan = catchAsync(async (req: Request, res: Response) => {
  const plan = await planService.setPlanActive(req.user!.id, req.params.id, false);
  sendSuccess(res, plan, "Plan deactivated");
});

export const archivePlan = catchAsync(async (req: Request, res: Response) => {
  const plan = await planService.archivePlan(req.user!.id, req.params.id, true);
  sendSuccess(res, plan, "Plan archived");
});

export const unarchivePlan = catchAsync(async (req: Request, res: Response) => {
  const plan = await planService.archivePlan(req.user!.id, req.params.id, false);
  sendSuccess(res, plan, "Plan restored");
});

export const duplicatePlan = catchAsync(async (req: Request, res: Response) => {
  const plan = await planService.duplicatePlan(req.user!.id, req.params.id);
  sendSuccess(res, plan, "Plan duplicated", 201);
});

export const useTemplate = catchAsync(async (req: Request, res: Response) => {
  const plan = await planService.useTemplate(req.user!.id, req.params.id);
  sendSuccess(res, plan, "Template added to your plans", 201);
});
