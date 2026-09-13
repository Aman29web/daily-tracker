import { Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync";
import { sendSuccess } from "../utils/ApiResponse";
import { UserSettings } from "../models/UserSettings";

export const getSettings = catchAsync(async (req: Request, res: Response) => {
  const settings = await UserSettings.findOneAndUpdate(
    { userId: req.user!.id },
    { $setOnInsert: { userId: req.user!.id } },
    { upsert: true, new: true }
  );
  sendSuccess(res, settings);
});

export const updateSettings = catchAsync(async (req: Request, res: Response) => {
  const settings = await UserSettings.findOneAndUpdate(
    { userId: req.user!.id },
    { $set: req.body },
    { upsert: true, new: true, runValidators: true }
  );
  sendSuccess(res, settings, "Settings updated");
});
