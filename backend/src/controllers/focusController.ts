import { Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync";
import { buildPagination, sendSuccess } from "../utils/ApiResponse";
import * as focusService from "../services/focusService";

export const startSession = catchAsync(async (req: Request, res: Response) => {
  const session = await focusService.startSession(req.user!.id, req.user!.timezone, req.body);
  sendSuccess(res, session, "Focus session started", 201);
});

export const pauseSession = catchAsync(async (req: Request, res: Response) => {
  const session = await focusService.pauseSession(req.user!.id, req.params.id);
  sendSuccess(res, session, "Session paused");
});

export const resumeSession = catchAsync(async (req: Request, res: Response) => {
  const session = await focusService.resumeSession(req.user!.id, req.params.id);
  sendSuccess(res, session, "Session resumed");
});

export const completeSession = catchAsync(async (req: Request, res: Response) => {
  const session = await focusService.completeSession(req.user!.id, req.params.id, req.user!.timezone);
  sendSuccess(res, session, "Session completed");
});

export const cancelSession = catchAsync(async (req: Request, res: Response) => {
  const session = await focusService.cancelSession(req.user!.id, req.params.id);
  sendSuccess(res, session, "Session cancelled");
});

export const listSessions = catchAsync(async (req: Request, res: Response) => {
  const { page, limit, start, end, status } = req.query as unknown as {
    page: number;
    limit: number;
    start?: string;
    end?: string;
    status?: string;
  };
  const { items, total } = await focusService.listSessions(req.user!.id, { start, end, status }, page, limit);
  sendSuccess(res, items, "Sessions retrieved", 200, { pagination: buildPagination(page, limit, total) });
});
