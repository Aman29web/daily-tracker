import { Types } from "mongoose";
import { PlanPause } from "../models/PlanPause";
import { IHabit } from "../models/Habit";
import { PauseRange } from "./dayStatusService";

/** All pause windows (habit-level + the habit's plan-level) for a single habit. */
export async function getPauseRangesForHabit(userId: Types.ObjectId | string, habit: IHabit): Promise<PauseRange[]> {
  const or: Record<string, unknown>[] = [{ habitId: habit._id }];
  if (habit.planId) or.push({ planId: habit.planId });

  const pauses = await PlanPause.find({ userId, $or: or }).lean();
  return pauses.map((p) => ({ start: p.startDate, end: p.endDate }));
}

/**
 * Loads every pause for a user once and buckets them by habitId/planId so
 * bulk operations (dashboard, calendar, analytics over many habits) avoid
 * N+1 queries. Call getPauseRangesFromMap(map, habit) per habit afterwards.
 */
export async function getUserPauseMap(
  userId: Types.ObjectId | string
): Promise<{ byHabit: Map<string, PauseRange[]>; byPlan: Map<string, PauseRange[]> }> {
  const pauses = await PlanPause.find({ userId }).lean();
  const byHabit = new Map<string, PauseRange[]>();
  const byPlan = new Map<string, PauseRange[]>();

  for (const p of pauses) {
    const range = { start: p.startDate, end: p.endDate };
    if (p.habitId) {
      const key = p.habitId.toString();
      byHabit.set(key, [...(byHabit.get(key) ?? []), range]);
    }
    if (p.planId) {
      const key = p.planId.toString();
      byPlan.set(key, [...(byPlan.get(key) ?? []), range]);
    }
  }
  return { byHabit, byPlan };
}

export function getPauseRangesFromMap(
  map: { byHabit: Map<string, PauseRange[]>; byPlan: Map<string, PauseRange[]> },
  habit: IHabit
): PauseRange[] {
  const habitRanges = map.byHabit.get(habit._id.toString()) ?? [];
  const planRanges = habit.planId ? map.byPlan.get(habit.planId.toString()) ?? [] : [];
  return [...habitRanges, ...planRanges];
}
