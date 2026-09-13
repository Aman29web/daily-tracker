import { Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync";
import { sendSuccess } from "../utils/ApiResponse";
import { Habit } from "../models/Habit";
import { Task } from "../models/Task";
import { Goal } from "../models/Goal";
import { JournalEntry } from "../models/JournalEntry";

const LIMIT_PER_TYPE = 8;

export const globalSearch = catchAsync(async (req: Request, res: Response) => {
  const q = (req.query.q as string)?.trim();
  if (!q) return sendSuccess(res, { habits: [], tasks: [], goals: [], journal: [] });

  const regex = { $regex: q, $options: "i" };
  const userId = req.user!.id;

  const [habits, tasks, goals, journal] = await Promise.all([
    Habit.find({ userId, name: regex }).limit(LIMIT_PER_TYPE),
    Task.find({ userId, title: regex }).limit(LIMIT_PER_TYPE),
    Goal.find({ userId, title: regex }).limit(LIMIT_PER_TYPE),
    JournalEntry.find({ userId, $or: [{ content: regex }, { wentWell: regex }, { learned: regex }] }).limit(LIMIT_PER_TYPE),
  ]);

  sendSuccess(res, { habits, tasks, goals, journal });
});
