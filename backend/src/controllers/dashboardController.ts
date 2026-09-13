import { Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync";
import { sendSuccess } from "../utils/ApiResponse";
import { getDashboard } from "../services/dashboardService";

export const getDashboardData = catchAsync(async (req: Request, res: Response) => {
  const data = await getDashboard(req.user!.id, req.user!.timezone);
  sendSuccess(res, data);
});
