import { Goal, IGoal } from "../models/Goal";
import { Task } from "../models/Task";
import { FocusSession } from "../models/FocusSession";
import { HabitCheckIn } from "../models/HabitCheckIn";
import { ApiError } from "../utils/ApiError";

export async function getOwnedGoal(userId: string, goalId: string): Promise<IGoal> {
  const goal = await Goal.findOne({ _id: goalId, userId });
  if (!goal) throw ApiError.notFound("Goal not found", "GOAL_NOT_FOUND");
  return goal;
}

export async function createGoal(userId: string, input: Record<string, unknown>): Promise<IGoal> {
  return Goal.create({ ...input, userId });
}

export async function updateGoal(userId: string, goalId: string, updates: Record<string, unknown>): Promise<IGoal> {
  const goal = await getOwnedGoal(userId, goalId);
  const completing = updates.status === "completed" && goal.status !== "completed";
  Object.assign(goal, updates);
  if (completing) goal.completedAt = new Date();
  await goal.save();
  return goal;
}

export async function deleteGoal(userId: string, goalId: string): Promise<void> {
  const goal = await getOwnedGoal(userId, goalId);
  await goal.deleteOne();
}

export async function listGoals(
  userId: string,
  filters: { status?: string; category?: string },
  page: number,
  limit: number
) {
  const query: Record<string, unknown> = { userId };
  if (filters.status) query.status = filters.status;
  if (filters.category) query.category = filters.category;

  const [items, total] = await Promise.all([
    Goal.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Goal.countDocuments(query),
  ]);
  return { items, total };
}

export async function setGoalProgress(userId: string, goalId: string, currentValue: number): Promise<IGoal> {
  const goal = await getOwnedGoal(userId, goalId);
  if (goal.progressSource !== "manual") {
    throw ApiError.badRequest("This goal's progress is derived automatically", "GOAL_NOT_MANUAL");
  }
  goal.currentValue = currentValue;
  if (currentValue >= goal.targetValue && goal.status === "active") {
    goal.status = "completed";
    goal.completedAt = new Date();
  }
  await goal.save();
  return goal;
}

/**
 * Recomputes currentValue for non-manual goals from their linked source.
 * Called after focus sessions complete, habit check-ins change, or tasks
 * tied to the goal change status - keeps derived goals accurate without
 * the frontend ever writing progress numbers itself.
 */
export async function recalculateGoalProgress(userId: string, goalId: string): Promise<IGoal | null> {
  const goal = await Goal.findOne({ _id: goalId, userId });
  if (!goal || goal.progressSource === "manual") return goal;

  let value = 0;
  if (goal.progressSource === "focus_sessions") {
    const result = await FocusSession.aggregate([
      { $match: { userId: goal.userId, goalId: goal._id, status: "completed" } },
      { $group: { _id: null, minutes: { $sum: "$actualDuration" } } },
    ]);
    value = (result[0]?.minutes ?? 0) / 60; // stored as hours when unit implies hours
  } else if (goal.progressSource === "habit_checkins") {
    value = await HabitCheckIn.countDocuments({
      userId: goal.userId,
      habitId: { $in: goal.linkedHabitIds },
      status: "completed",
    });
  } else if (goal.progressSource === "tasks") {
    value = await Task.countDocuments({ userId: goal.userId, goalId: goal._id, status: "completed" });
  }

  goal.currentValue = value;
  if (value >= goal.targetValue && goal.status === "active") {
    goal.status = "completed";
    goal.completedAt = new Date();
  }
  await goal.save();
  return goal;
}

export interface GoalPace {
  progressPercent: number;
  daysElapsed: number;
  daysRemaining: number | null;
  requiredPacePerDay: number | null;
  currentPacePerDay: number;
  predictedCompletionDate: string | null;
  onTrack: boolean | null;
}

export function computeGoalPace(goal: IGoal, todayStr: string): GoalPace {
  const created = goal.createdAt.toISOString().slice(0, 10);
  const daysElapsed = Math.max(1, dayDiff(created, todayStr));
  const progressPercent = goal.targetValue > 0 ? Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100)) : 0;
  const currentPacePerDay = goal.currentValue / daysElapsed;

  let daysRemaining: number | null = null;
  let requiredPacePerDay: number | null = null;
  let onTrack: boolean | null = null;
  let predictedCompletionDate: string | null = null;

  if (goal.deadline) {
    daysRemaining = Math.max(0, dayDiff(todayStr, goal.deadline));
    const remainingValue = Math.max(0, goal.targetValue - goal.currentValue);
    requiredPacePerDay = daysRemaining > 0 ? remainingValue / daysRemaining : remainingValue > 0 ? Infinity : 0;
    onTrack = currentPacePerDay >= (requiredPacePerDay === Infinity ? Number.MAX_SAFE_INTEGER : requiredPacePerDay);
  }

  if (currentPacePerDay > 0 && goal.currentValue < goal.targetValue) {
    const daysNeeded = Math.ceil((goal.targetValue - goal.currentValue) / currentPacePerDay);
    predictedCompletionDate = addDaysSimple(todayStr, daysNeeded);
  }

  return { progressPercent, daysElapsed, daysRemaining, requiredPacePerDay, currentPacePerDay, predictedCompletionDate, onTrack };
}

function dayDiff(a: string, b: string): number {
  const ms = new Date(`${b}T00:00:00Z`).getTime() - new Date(`${a}T00:00:00Z`).getTime();
  return Math.round(ms / 86400000);
}

function addDaysSimple(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
