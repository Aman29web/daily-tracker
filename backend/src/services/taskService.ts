import { Types } from "mongoose";
import { Task, ITask } from "../models/Task";
import { ApiError } from "../utils/ApiError";
import { todayInTimezone } from "../utils/dateUtils";
import { recalculateGoalProgress } from "./goalService";
import { evaluateAchievementsForUser } from "./achievementService";

export async function getOwnedTask(userId: string, taskId: string): Promise<ITask> {
  const task = await Task.findOne({ _id: taskId, userId });
  if (!task) throw ApiError.notFound("Task not found", "TASK_NOT_FOUND");
  return task;
}

export async function createTask(userId: string, input: Record<string, unknown>): Promise<ITask> {
  const count = await Task.countDocuments({ userId });
  return Task.create({ ...input, userId, order: count });
}

export async function updateTask(
  userId: string,
  taskId: string,
  updates: Record<string, unknown>,
  timezone: string
): Promise<ITask> {
  const task = await getOwnedTask(userId, taskId);
  const becomingCompleted = updates.status === "completed" && task.status !== "completed";
  const leavingCompleted = updates.status && updates.status !== "completed" && task.status === "completed";

  Object.assign(task, updates);
  if (becomingCompleted) task.completedAt = new Date();
  if (leavingCompleted) task.completedAt = null;
  await task.save();

  if ((becomingCompleted || leavingCompleted) && task.goalId) {
    await recalculateGoalProgress(userId, task.goalId.toString());
  }
  if (becomingCompleted) {
    await evaluateAchievementsForUser(userId, timezone);
  }
  return task;
}

export async function deleteTask(userId: string, taskId: string): Promise<void> {
  const task = await getOwnedTask(userId, taskId);
  await task.deleteOne();
}

export async function listTasks(
  userId: string,
  filters: {
    status?: string;
    priority?: string;
    category?: string;
    goalId?: string;
    search?: string;
    dueBefore?: string;
    dueAfter?: string;
  },
  page: number,
  limit: number
) {
  const query: Record<string, unknown> = { userId };
  if (filters.status) query.status = filters.status;
  if (filters.priority) query.priority = filters.priority;
  if (filters.category) query.category = filters.category;
  if (filters.goalId) query.goalId = new Types.ObjectId(filters.goalId);
  if (filters.search) query.title = { $regex: filters.search, $options: "i" };
  if (filters.dueBefore || filters.dueAfter) {
    query.dueDate = {
      ...(filters.dueBefore ? { $lte: filters.dueBefore } : {}),
      ...(filters.dueAfter ? { $gte: filters.dueAfter } : {}),
    };
  }

  const [items, total] = await Promise.all([
    Task.find(query)
      .sort({ order: 1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Task.countDocuments(query),
  ]);
  return { items, total };
}

export async function getTop3(userId: string, date: string): Promise<ITask[]> {
  return Task.find({ userId, isTop3: true, top3Date: date }).sort({ order: 1 });
}

export async function setTop3(userId: string, date: string, taskIds: string[]): Promise<ITask[]> {
  await Task.updateMany({ userId, top3Date: date, isTop3: true }, { $set: { isTop3: false, top3Date: null } });

  await Promise.all(
    taskIds.map((id, index) =>
      Task.updateOne(
        { _id: id, userId },
        { $set: { isTop3: true, top3Date: date, order: index } }
      )
    )
  );

  return getTop3(userId, date);
}

export async function reorderTasks(userId: string, orderedIds: string[]): Promise<void> {
  await Promise.all(
    orderedIds.map((id, index) => Task.updateOne({ _id: id, userId }, { $set: { order: index } }))
  );
}

export async function getTop3Completion(userId: string, date: string): Promise<{ total: number; completed: number }> {
  const tasks = await getTop3(userId, date);
  return { total: tasks.length, completed: tasks.filter((t) => t.status === "completed").length };
}

export function todayForUser(timezone: string): string {
  return todayInTimezone(timezone);
}
