import { Habit } from "../models/Habit";
import { HabitCheckIn } from "../models/HabitCheckIn";
import { Goal } from "../models/Goal";
import { JournalEntry } from "../models/JournalEntry";
import { MoodEntry } from "../models/MoodEntry";
import { computeDailyProductivityScore } from "./productivityScoreService";
import { getUserHabitStatusesForDate } from "./habitService";
import { getTop3 } from "./taskService";
import { computeHabitStreak } from "./streakService";
import { getUserPauseMap, getPauseRangesFromMap } from "./pauseService";
import { getFocusMinutesForRange } from "./focusService";
import { getHeroMessage } from "./motivationService";
import { addDays, todayInTimezone } from "../utils/dateUtils";
import { DailySummary } from "../models/DailySummary";

export async function getDashboard(userId: string, timezone: string) {
  const today = todayInTimezone(timezone);
  const yesterday = addDays(today, -1);

  // habitStatuses is resolved once here and handed to computeDailyProductivityScore
  // below instead of letting it re-resolve the same date's statuses itself.
  const [habitStatuses, activeHabitCount, top3, goals, journal, mood, focusMinutes, yesterdaySummary] = await Promise.all([
    getUserHabitStatusesForDate(userId, today, timezone),
    Habit.countDocuments({ userId, isActive: true }),
    getTop3(userId, today),
    Goal.find({ userId, status: "active" }).sort({ deadline: 1 }).limit(5),
    JournalEntry.findOne({ userId, date: today }),
    MoodEntry.findOne({ userId, date: today }),
    getFocusMinutesForRange(userId, today, today),
    DailySummary.findOne({ userId, date: yesterday }),
  ]);
  const breakdown = await computeDailyProductivityScore(userId, today, timezone, {
    habitStatuses,
    focusMinutes,
    top3: { total: top3.length, completed: top3.filter((t) => t.status === "completed").length },
  });

  // Pauses and check-ins for every one of today's habits are loaded in two
  // bulk queries (mirrors listHabitsForUser) instead of one round trip per
  // habit - same inputs into computeHabitStreak, so streak/status output is
  // unchanged, just not fetched N times over.
  const [pauseMap, allCheckIns] = await Promise.all([
    getUserPauseMap(userId),
    HabitCheckIn.find({ habitId: { $in: habitStatuses.map((s) => s.habit._id) } }).lean(),
  ]);
  const checkInsByHabit = new Map<string, typeof allCheckIns>();
  for (const c of allCheckIns) {
    const key = c.habitId.toString();
    checkInsByHabit.set(key, [...(checkInsByHabit.get(key) ?? []), c]);
  }

  let longestActiveStreak = 0;
  const habitCards = habitStatuses.map((s) => {
    const pauseRanges = getPauseRangesFromMap(pauseMap, s.habit);
    const checkIns = checkInsByHabit.get(s.habit._id.toString()) ?? [];
    const streak = computeHabitStreak(s.habit, today, pauseRanges, checkIns);
    longestActiveStreak = Math.max(longestActiveStreak, streak.current);
    return {
      habit: {
        id: s.habit._id.toString(),
        name: s.habit.name,
        icon: s.habit.icon,
        color: s.habit.color,
        type: s.habit.type,
        priority: s.habit.priority,
        category: s.habit.category,
      },
      status: s.status,
      value: s.value,
      targetValue: s.targetValue,
      streak: streak.current,
    };
  });

  const seed = Number(today.replace(/-/g, ""));
  const hour = Number(new Intl.DateTimeFormat("en-US", { timeZone: timezone, hour: "numeric", hourCycle: "h23" }).format(new Date()));
  const hero = getHeroMessage(
    {
      hour,
      productivityScore: yesterdaySummary?.productivityScore ?? null,
      longestActiveStreak,
      habitsCompletedToday: breakdown.habits.completed,
      habitsScheduledToday: breakdown.habits.scheduled,
    },
    seed
  );

  return {
    date: today,
    hero,
    productivity: breakdown,
    habits: habitCards,
    top3,
    goals,
    focusMinutes,
    mood: mood ? { mood: mood.mood, energy: mood.energy } : null,
    journalCompleted: !!journal,
    streaks: { longestActive: longestActiveStreak },
    totalActiveHabits: activeHabitCount,
  };
}
