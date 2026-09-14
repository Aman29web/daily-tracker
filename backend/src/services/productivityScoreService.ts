import { Habit } from "../models/Habit";
import { Task } from "../models/Task";
import { getUserHabitStatusesForDate, HabitDateStatus } from "./habitService";
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
export interface PrecomputedScoreInputs {
  habitStatuses?: HabitDateStatus[];
  /** Total minutes already resolved for `date` (skip the aggregate query when the caller has it). */
  focusMinutes?: number;
  /** Already-resolved top-3 completion for `date` (skip re-querying top-3 for it). */
  top3?: { total: number; completed: number };
}

export async function computeDailyProductivityScore(
  userId: string,
  date: string,
  timezone: string,
  precomputed?: PrecomputedScoreInputs
): Promise<ProductivityBreakdown> {
  // The dashboard already resolves this same date's habit statuses (and,
  // below, its focus minutes / top-3 completion) for its own display -
  // accepting them here (all optional, so every other caller is
  // unaffected) avoids resolving the same data a second time per request.
  const habitStatuses = precomputed?.habitStatuses ?? (await getUserHabitStatusesForDate(userId, date, timezone));
  const scheduledStatuses = habitStatuses.filter((h) => h.scheduled);
  const completed = scheduledStatuses.filter((h) => h.status === "completed").length;
  const missed = scheduledStatuses.filter((h) => h.status === "missed" || h.status === "skipped").length;
  const scheduledCount = scheduledStatuses.length;

  // Tasks/focus/top-3 (display-only, see below) and, when nothing was
  // scheduled, the "did tracking even exist yet" check are all independent
  // of each other and of the habit score - fetch them together instead of
  // one round trip at a time.
  const [hadAnyHabitByThen, tasksDue, focusMinutes, top3] = await Promise.all([
    scheduledCount > 0 ? Promise.resolve(false) : Habit.exists({ userId, startDate: { $lte: date } }).then(Boolean),
    Task.find({ userId, dueDate: date, status: { $ne: "cancelled" } }),
    precomputed?.focusMinutes !== undefined ? Promise.resolve(precomputed.focusMinutes) : getFocusMinutesForRange(userId, date, date),
    precomputed?.top3 ?? getTop3Completion(userId, date),
  ]);

  let score: number;
  let habitScore: number;
  if (scheduledCount > 0) {
    habitScore = Math.round((completed / scheduledCount) * 100);
    score = habitScore;
  } else {
    // Not "any habit ever" - "any habit that had already started by this date". Otherwise a
    // habit created today would retroactively paint every prior day, before it existed, as a
    // perfect 100% rest day.
    habitScore = hadAnyHabitByThen ? 100 : 0;
    score = habitScore;
  }

  // Tracked for display (dashboard/analytics) only - not blended into `score`.
  const tasksCompleted = tasksDue.filter((t) => t.status === "completed").length;
  const taskScore = tasksDue.length === 0 ? 100 : Math.round((tasksCompleted / tasksDue.length) * 100);

  const focusScore = focusMinutes > 0 ? Math.min(100, Math.round((focusMinutes / DAILY_FOCUS_GOAL_MINUTES) * 100)) : 100;

  const top3Score = top3.total === 0 ? 100 : Math.round((top3.completed / top3.total) * 100);

  return {
    score,
    habits: { score: habitScore, completed, missed, scheduled: scheduledCount },
    tasks: { score: taskScore, completed: tasksCompleted, total: tasksDue.length },
    focus: { score: focusScore, minutes: focusMinutes, goalMinutes: DAILY_FOCUS_GOAL_MINUTES },
    top3: { score: top3Score, completed: top3.completed, total: top3.total },
  };
}
