import { Habit } from "../models/Habit";
import { Task } from "../models/Task";
import { getUserHabitStatusesForDate } from "./habitService";
import { getTop3Completion } from "./taskService";
import { getFocusMinutesForRange } from "./focusService";

export interface ProductivityBreakdown {
  score: number;
  habits: { score: number; completed: number; missed: number; scheduled: number };
  tasks: { score: number; completed: number; total: number };
  focus: { score: number; minutes: number; goalMinutes: number };
  top3: { score: number; completed: number; total: number };
}

const DAILY_FOCUS_GOAL_MINUTES = 120;

/**
 * The single source of truth for "how productive was this day". Never
 * computed in the frontend (rule #33).
 *
 * By explicit product decision, the score is driven entirely by habit
 * completion - tasks/focus/top-3 are still tracked and returned below for
 * display (the dashboard's task and focus stats, analytics, etc.) but no
 * longer move the number itself, so finishing every habit you scheduled
 * for the day always means 100%, full stop.
 *
 * A day with nothing scheduled is neutral (100%, a rest day is never a
 * failure) - but that's only fair for a day where the user actually had at
 * least one habit already in existence to *not* schedule. A date before
 * any habit's startDate (including every day for an account with zero
 * habits ever created) has nothing to be neutral about - tracking simply
 * hadn't started yet - so it scores 0% rather than a fabricated 100%.
 */
export async function computeDailyProductivityScore(
  userId: string,
  date: string,
  timezone: string
): Promise<ProductivityBreakdown> {
  const habitStatuses = await getUserHabitStatusesForDate(userId, date, timezone);
  const scheduledStatuses = habitStatuses.filter((h) => h.scheduled);
  const completed = scheduledStatuses.filter((h) => h.status === "completed").length;
  const missed = scheduledStatuses.filter((h) => h.status === "missed" || h.status === "skipped").length;
  const scheduledCount = scheduledStatuses.length;

  let score: number;
  let habitScore: number;
  if (scheduledCount > 0) {
    habitScore = Math.round((completed / scheduledCount) * 100);
    score = habitScore;
  } else {
    // Not "any habit ever" - "any habit that had already started by this date". Otherwise a
    // habit created today would retroactively paint every prior day, before it existed, as a
    // perfect 100% rest day.
    const hadAnyHabitByThen = (await Habit.countDocuments({ userId, startDate: { $lte: date } })) > 0;
    habitScore = hadAnyHabitByThen ? 100 : 0;
    score = habitScore;
  }

  // Tracked for display (dashboard/analytics) only - not blended into `score`.
  const tasksDue = await Task.find({ userId, dueDate: date, status: { $ne: "cancelled" } });
  const tasksCompleted = tasksDue.filter((t) => t.status === "completed").length;
  const taskScore = tasksDue.length === 0 ? 100 : Math.round((tasksCompleted / tasksDue.length) * 100);

  const focusMinutes = await getFocusMinutesForRange(userId, date, date);
  const focusScore = focusMinutes > 0 ? Math.min(100, Math.round((focusMinutes / DAILY_FOCUS_GOAL_MINUTES) * 100)) : 100;

  const top3 = await getTop3Completion(userId, date);
  const top3Score = top3.total === 0 ? 100 : Math.round((top3.completed / top3.total) * 100);

  return {
    score,
    habits: { score: habitScore, completed, missed, scheduled: scheduledCount },
    tasks: { score: taskScore, completed: tasksCompleted, total: tasksDue.length },
    focus: { score: focusScore, minutes: focusMinutes, goalMinutes: DAILY_FOCUS_GOAL_MINUTES },
    top3: { score: top3Score, completed: top3.completed, total: top3.total },
  };
}
