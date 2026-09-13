import { Habit } from "../models/Habit";
import { HabitCheckIn } from "../models/HabitCheckIn";
import { Goal } from "../models/Goal";
import { JournalEntry } from "../models/JournalEntry";
import { MoodEntry } from "../models/MoodEntry";
import { computeDailyProductivityScore } from "./productivityScoreService";
import { getUserHabitStatusesForDate } from "./habitService";
import { getTop3 } from "./taskService";
import { computeHabitStreak } from "./streakService";
import { getPauseRangesForHabit } from "./pauseService";
import { getFocusMinutesForRange } from "./focusService";
import { getHeroMessage } from "./motivationService";
import { addDays, todayInTimezone } from "../utils/dateUtils";
import { DailySummary } from "../models/DailySummary";

export async function getDashboard(userId: string, timezone: string) {
  const today = todayInTimezone(timezone);
  const yesterday = addDays(today, -1);

  const [breakdown, habitStatuses, top3, goals, journal, mood, focusMinutes, yesterdaySummary] = await Promise.all([
    computeDailyProductivityScore(userId, today, timezone),
    getUserHabitStatusesForDate(userId, today, timezone),
    getTop3(userId, today),
    Goal.find({ userId, status: "active" }).sort({ deadline: 1 }).limit(5),
    JournalEntry.findOne({ userId, date: today }),
    MoodEntry.findOne({ userId, date: today }),
    getFocusMinutesForRange(userId, today, today),
    DailySummary.findOne({ userId, date: yesterday }),
  ]);

  const habits = await Habit.find({ userId, isActive: true });
  let longestActiveStreak = 0;
  const habitCards = await Promise.all(
    habitStatuses.map(async (s) => {
      const pauseRanges = await getPauseRangesForHabit(userId, s.habit);
      const checkIns = await HabitCheckIn.find({ habitId: s.habit._id }).lean();
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
    })
  );

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
    totalActiveHabits: habits.length,
  };
}
