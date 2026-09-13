import { Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync";
import { buildPagination, sendSuccess } from "../utils/ApiResponse";
import * as taskService from "../services/taskService";

export const listTasks = catchAsync(async (req: Request, res: Response) => {
  const { page, limit, ...filters } = req.query as unknown as {
    page: number;
    limit: number;
    status?: string;
    priority?: string;
    category?: string;
    goalId?: string;
    search?: string;
    dueBefore?: string;
    dueAfter?: string;
  };
  const { items, total } = await taskService.listTasks(req.user!.id, filters, page, limit);
  sendSuccess(res, items, "Tasks retrieved", 200, { pagination: buildPagination(page, limit, total) });
});

export const createTask = catchAsync(async (req: Request, res: Response) => {
  const task = await taskService.createTask(req.user!.id, req.body);
  sendSuccess(res, task, "Task created", 201);
});

export const updateTask = catchAsync(async (req: Request, res: Response) => {
  const task = await taskService.updateTask(req.user!.id, req.params.id, req.body, req.user!.timezone);
  sendSuccess(res, task, "Task updated");
});

export const deleteTask = catchAsync(async (req: Request, res: Response) => {
  await taskService.deleteTask(req.user!.id, req.params.id);
  sendSuccess(res, null, "Task deleted");
});

export const getTop3 = catchAsync(async (req: Request, res: Response) => {
  const date = (req.query.date as string) ?? taskService.todayForUser(req.user!.timezone);
  const top3 = await taskService.getTop3(req.user!.id, date);
  sendSuccess(res, top3);
});

export const setTop3 = catchAsync(async (req: Request, res: Response) => {
  const { date, taskIds } = req.body;
  const top3 = await taskService.setTop3(req.user!.id, date, taskIds);
  sendSuccess(res, top3, "Top 3 updated");
});

export const reorderTasks = catchAsync(async (req: Request, res: Response) => {
  await taskService.reorderTasks(req.user!.id, req.body.orderedIds);
  sendSuccess(res, null, "Tasks reordered");
});
