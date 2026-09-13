import { Types } from "mongoose";
import { Habit, IHabit, IHabitSchedule } from "../models/Habit";
import { HabitCheckIn, IHabitCheckIn } from "../models/HabitCheckIn";
import { ApiError } from "../utils/ApiError";
import { addDays, enumerateDates, todayInTimezone } from "../utils/dateUtils";
import { resolveDayStatus, DayStatusResult, PauseRange } from "./dayStatusService";
import { computeHabitStreak, StreakResult } from "./streakService";
import { getPauseRangesForHabit, getPauseRangesFromMap, getUserPauseMap } from "./pauseService";
import { evaluateAchievementsForUser } from "./achievementService";

export async function getOwnedHabit(userId: string, habitId: string): Promise<IHabit> {
  const habit = await Habit.findOne({ _id: habitId, userId });
  if (!habit) throw ApiError.notFound("Habit not found", "HABIT_NOT_FOUND");
  return habit;
}

export async function createHabit(userId: string, input: Record<string, unknown>): Promise<IHabit> {
  const schedule = input.schedule as IHabitSchedule;
  const startDate = input.startDate as string;

  const habit = await Habit.create({
    ...input,
    userId,
    scheduleHistory: [{ schedule, effectiveFrom: startDate, effectiveTo: null }],
  });
  return habit;
}

export async function updateHabit(userId: string, habitId: string, updates: Record<string, unknown>): Promise<IHabit> {
  const habit = await getOwnedHabit(userId, habitId);
  Object.assign(habit, updates);
  await habit.save();
  return habit;
}

/**
 * Changing a schedule must never rewrite history: the currently-open
 * version is closed as of the day before `effectiveFrom` and a new version
 * begins on `effectiveFrom` (defaults to today in the user's timezone).
 * Past occurrence/streak computation keeps resolving against the old
 * version because resolveDayStatus looks up the version active *on that
 * date*, not the latest one.
 */
export async function updateHabitSchedule(
  userId: string,
  habitId: string,
  schedule: IHabitSchedule,
  effectiveFrom: string,
  timezone: string
): Promise<IHabit> {
  const habit = await getOwnedHabit(userId, habitId);
  const today = todayInTimezone(timezone);
  const from = effectiveFrom && effectiveFrom >= today ? effectiveFrom : today;

  const current = habit.scheduleHistory.find((v) => !v.effectiveTo);
  if (current) current.effectiveTo = addDays(from, -1);

  habit.scheduleHistory.push({ schedule, effectiveFrom: from, effectiveTo: null });
  await habit.save();
  return habit;
}

export async function deleteHabit(userId: string, habitId: string): Promise<void> {
  const habit = await getOwnedHabit(userId, habitId);
  // Historical check-ins stay queryable (rule #51); we soft-delete by deactivating
  // and clearing future scheduling instead of destroying the habit document.
  habit.isActive = false;
  habit.endDate = todayInTimezone("UTC");
  await habit.save();
}

export async function hardDeleteHabit(userId: string, habitId: string): Promise<void> {
  const habit = await getOwnedHabit(userId, habitId);
  await HabitCheckIn.deleteMany({ habitId: habit._id });
  await habit.deleteOne();
}

export interface HabitWithStats {
  habit: IHabit;
  today: DayStatusResult;
  streak: StreakResult;
}

export async function getHabitWithStats(userId: string, habitId: string, timezone: string): Promise<HabitWithStats> {
  const habit = await getOwnedHabit(userId, habitId);
  const today = todayInTimezone(timezone);
  const pauseRanges = await getPauseRangesForHabit(userId, habit);
  const checkIns = await HabitCheckIn.find({ habitId: habit._id }).lean();
  const todayCheckIn = checkIns.find((c) => c.date === today) ?? null;

  const todayStatus = resolveDayStatus({ habit, dateStr: today, today, pauseRanges, checkIn: todayCheckIn });
  const streak = computeHabitStreak(habit, today, pauseRanges, checkIns);

  return { habit, today: todayStatus, streak };
}

export async function getHabitRangeStatuses(
  userId: string,
  habitId: string,
  start: string,
  end: string,
  timezone: string
): Promise<Array<{ date: string } & DayStatusResult>> {
  const habit = await getOwnedHabit(userId, habitId);
  const today = todayInTimezone(timezone);
  const pauseRanges = await getPauseRangesForHabit(userId, habit);
  const checkIns = await HabitCheckIn.find({ habitId: habit._id, date: { $gte: start, $lte: end } }).lean();
  const checkInMap = new Map(checkIns.map((c) => [c.date, c]));

  return enumerateDates(start, end).map((date) => ({
    date,
    ...resolveDayStatus({ habit, dateStr: date, today, pauseRanges, checkIn: checkInMap.get(date) }),
  }));
}

interface CheckInAction {
  date: string;
  action: "complete" | "undo" | "skip" | "miss" | "increment" | "set_value";
  value?: number;
  note?: string;
}

export async function performCheckIn(
  userId: string,
  habitId: string,
  input: CheckInAction,
  timezone: string
): Promise<{ habit: IHabit; day: DayStatusResult; streak: StreakResult }> {
  const habit = await getOwnedHabit(userId, habitId);
  const today = todayInTimezone(timezone);
  const pauseRanges = await getPauseRangesForHabit(userId, habit);

  if (input.date > today) {
    throw ApiError.badRequest("Cannot check in on a future date", "FUTURE_CHECKIN");
  }

  const existing = await HabitCheckIn.findOne({ habitId: habit._id, date: input.date });

  if (input.action === "undo") {
    if (existing) await existing.deleteOne();
  } else if (input.action === "complete") {
    await HabitCheckIn.findOneAndUpdate(
      { habitId: habit._id, date: input.date },
      {
        $set: {
          userId,
          habitId: habit._id,
          date: input.date,
          status: "completed",
          note: input.note,
          completedAt: new Date(),
          ...(habit.type === "numeric" ? { value: habit.target?.value ?? input.value ?? 1 } : {}),
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  } else if (input.action === "skip") {
    await HabitCheckIn.findOneAndUpdate(
      { habitId: habit._id, date: input.date },
      { $set: { userId, habitId: habit._id, date: input.date, status: "skipped", note: input.note } },
      { upsert: true, new: true }
    );
  } else if (input.action === "miss") {
    await HabitCheckIn.findOneAndUpdate(
      { habitId: habit._id, date: input.date },
      { $set: { userId, habitId: habit._id, date: input.date, status: "missed", note: input.note } },
      { upsert: true, new: true }
    );
  } else if (input.action === "increment" || input.action === "set_value") {
    if (habit.type !== "numeric") throw ApiError.badRequest("Only numeric habits support progress values", "INVALID_ACTION");
    const delta = input.value ?? 1;
    const newValue =
      input.action === "set_value" ? delta : Math.max(0, (existing?.value ?? 0) + delta);
    const met = habit.target ? newValue >= habit.target.value : false;
    const setFields: Record<string, unknown> = {
      userId,
      habitId: habit._id,
      date: input.date,
      value: newValue,
      note: input.note,
    };
    if (met) {
      setFields.status = "completed";
      setFields.completedAt = new Date();
    }
    await HabitCheckIn.findOneAndUpdate(
      { habitId: habit._id, date: input.date },
      met ? { $set: setFields } : { $set: setFields, $unset: { status: "" } },
      { upsert: true, new: true }
    );
  }

  const checkIns = await HabitCheckIn.find({ habitId: habit._id }).lean();
  const dayResult = resolveDayStatus({
    habit,
    dateStr: input.date,
    today,
    pauseRanges,
    checkIn: checkIns.find((c) => c.date === input.date) ?? null,
  });
  const streak = computeHabitStreak(habit, today, pauseRanges, checkIns);

  if (dayResult.status === "completed") {
    await evaluateAchievementsForUser(userId, timezone);
  }

  return { habit, day: dayResult, streak };
}

export interface HabitListItem {
  habit: IHabit;
  today: DayStatusResult;
  streak: StreakResult;
}

export async function listHabitsForUser(
  userId: string,
  filters: { category?: string; planId?: string; isActive?: boolean; search?: string },
  page: number,
  limit: number,
  timezone: string
): Promise<{ items: HabitListItem[]; total: number }> {
  const query: Record<string, unknown> = { userId };
  if (filters.category) query.category = filters.category;
  if (filters.planId) query.planId = new Types.ObjectId(filters.planId);
  if (filters.isActive !== undefined) query.isActive = filters.isActive;
  if (filters.search) query.name = { $regex: filters.search, $options: "i" };

  const [habits, total] = await Promise.all([
    Habit.find(query)
      .sort({ priority: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Habit.countDocuments(query),
  ]);
  if (!habits.length) return { items: [], total };

  // Enrich with real today-status + streak (mirrors dashboardService) so the
  // habits list never shows a stale/hardcoded "not done yet" state for a
  // habit the user already checked in on today.
  const today = todayInTimezone(timezone);
  const [pauseMap, allCheckIns] = await Promise.all([
    getUserPauseMap(userId),
    HabitCheckIn.find({ habitId: { $in: habits.map((h) => h._id) } }).lean(),
  ]);
  const checkInsByHabit = new Map<string, typeof allCheckIns>();
  for (const c of allCheckIns) {
    const key = c.habitId.toString();
    checkInsByHabit.set(key, [...(checkInsByHabit.get(key) ?? []), c]);
  }

  const items: HabitListItem[] = habits.map((habit) => {
    const pauseRanges = getPauseRangesFromMap(pauseMap, habit);
    const checkIns = checkInsByHabit.get(habit._id.toString()) ?? [];
    const todayCheckIn = checkIns.find((c) => c.date === today) ?? null;
    return {
      habit,
      today: resolveDayStatus({ habit, dateStr: today, today, pauseRanges, checkIn: todayCheckIn }),
      streak: computeHabitStreak(habit, today, pauseRanges, checkIns),
    };
  });

  return { items, total };
}

export function buildPauseRangesLite(ranges: PauseRange[]) {
  return ranges;
}

/**
 * Bulk day-status resolution for every active habit a user has, on one
 * date - the building block for the daily productivity score and the
 * dashboard's "today's habits" list. Loads pauses and check-ins once
 * instead of per-habit to stay cheap even with dozens of habits.
 */
export async function getUserHabitStatusesForDate(
  userId: string,
  date: string,
  timezone: string
): Promise<Array<{ habit: IHabit } & DayStatusResult>> {
  const today = todayInTimezone(timezone);
  const habits = await Habit.find({
    userId,
    startDate: { $lte: date },
    $or: [{ endDate: null }, { endDate: { $gte: date } }],
  });
  if (!habits.length) return [];

  const [pauseMap, checkIns] = await Promise.all([
    getUserPauseMap(userId),
    HabitCheckIn.find({ userId, habitId: { $in: habits.map((h) => h._id) }, date }).lean(),
  ]);
  const checkInByHabit = new Map(checkIns.map((c) => [c.habitId.toString(), c]));

  return habits.map((habit) => ({
    habit,
    ...resolveDayStatus({
      habit,
      dateStr: date,
      today,
      pauseRanges: getPauseRangesFromMap(pauseMap, habit),
      checkIn: checkInByHabit.get(habit._id.toString()) ?? null,
    }),
  }));
}

export type { IHabitCheckIn };
