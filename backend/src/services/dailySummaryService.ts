import { Types } from "mongoose";
import { DailySummary, IDailySummary } from "../models/DailySummary";
import { FocusSession } from "../models/FocusSession";
import { JournalEntry } from "../models/JournalEntry";
import { MoodEntry } from "../models/MoodEntry";
import { User } from "../models/User";
import { computeDailyProductivityScore } from "./productivityScoreService";
import { getUserHabitStatusesForDate } from "./habitService";
import { getTop3Completion } from "./taskService";
import { todayInTimezone } from "../utils/dateUtils";

/**
 * Rebuilds (or creates) the cached DailySummary row for one user/date from
 * source collections. Always safe to call repeatedly - the row is a
 * read-optimization, never authoritative. `isFinal` marks a day whose date
 * has fully passed in the user's timezone, so live dashboard reads know
 * they can trust the cache without recomputing.
 */
export async function generateDailySummary(userId: string, date: string, timezone: string): Promise<IDailySummary> {
  const [breakdown, habitStatuses, mood, journal, focusAgg] = await Promise.all([
    computeDailyProductivityScore(userId, date, timezone),
    getUserHabitStatusesForDate(userId, date, timezone),
    MoodEntry.findOne({ userId, date }),
    JournalEntry.findOne({ userId, date }),
    FocusSession.aggregate([
      { $match: { userId: new Types.ObjectId(userId), date, status: "completed" } },
      { $group: { _id: null, minutes: { $sum: "$actualDuration" }, count: { $sum: 1 } } },
    ]),
  ]);

  const top3 = await getTop3Completion(userId, date);
  const today = todayInTimezone(timezone);

  const habitsRestDay = habitStatuses.filter((h) => h.status === "rest_day" || h.status === "not_scheduled").length;
  const habitsPaused = habitStatuses.filter((h) => h.status === "paused").length;

  const summary = await DailySummary.findOneAndUpdate(
    { userId, date },
    {
      $set: {
        productivityScore: breakdown.score,
        habitsScheduled: breakdown.habits.scheduled,
        habitsCompleted: breakdown.habits.completed,
        habitsMissed: breakdown.habits.missed,
        habitsSkipped: habitStatuses.filter((h) => h.status === "skipped").length,
        habitsPaused,
        habitsRestDay,
        tasksTotal: breakdown.tasks.total,
        tasksCompleted: breakdown.tasks.completed,
        focusMinutes: focusAgg[0]?.minutes ?? 0,
        focusSessions: focusAgg[0]?.count ?? 0,
        mood: mood?.mood ?? null,
        energy: mood?.energy ?? null,
        journalCompleted: !!journal,
        top3Total: top3.total,
        top3Completed: top3.completed,
        isFinal: date < today,
        generatedAt: new Date(),
      },
    },
    { upsert: true, new: true }
  );

  return summary;
}

/** Returns the cached summary if it's final (day has passed) and exists; otherwise regenerates it live. */
export async function getOrGenerateDailySummary(userId: string, date: string, timezone: string): Promise<IDailySummary> {
  const existing = await DailySummary.findOne({ userId, date });
  if (existing?.isFinal) return existing;
  return generateDailySummary(userId, date, timezone);
}

export async function getSummariesInRange(userId: string, start: string, end: string): Promise<IDailySummary[]> {
  return DailySummary.find({ userId, date: { $gte: start, $lte: end } }).sort({ date: 1 });
}

/** Nightly job target: finalize every active user's "yesterday" (in their own timezone). */
export async function finalizeYesterdayForAllUsers(): Promise<number> {
  const users = await User.find().select("timezone");
  let count = 0;
  for (const user of users) {
    const today = todayInTimezone(user.timezone);
    const yesterday = new Date(`${today}T00:00:00.000Z`);
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    const existing = await DailySummary.findOne({ userId: user._id, date: yesterdayStr });
    if (existing?.isFinal) continue;

    await generateDailySummary(user._id.toString(), yesterdayStr, user.timezone);
    count += 1;
  }
  return count;
}
