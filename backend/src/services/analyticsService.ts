import { DailySummary, IDailySummary } from "../models/DailySummary";
import { Habit } from "../models/Habit";
import { HabitCheckIn } from "../models/HabitCheckIn";
import { FocusSession } from "../models/FocusSession";
import { MoodEntry } from "../models/MoodEntry";
import { getOrGenerateDailySummary } from "./dailySummaryService";
import { getUserHabitStatusesForDate } from "./habitService";
import {
  addDays,
  dayOfWeek,
  enumerateDates,
  endOfMonth,
  endOfWeek,
  startOfMonth,
  startOfWeek,
  timeInTimezone,
} from "../utils/dateUtils";
import { MOOD_SCORES, Mood } from "../types/enums";

const WEEKDAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function average(values: number[]): number {
  if (!values.length) return 0;
  return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
}

async function summariesForRange(userId: string, start: string, end: string, timezone: string): Promise<IDailySummary[]> {
  const dates = enumerateDates(start, end);
  return Promise.all(dates.map((date) => getOrGenerateDailySummary(userId, date, timezone)));
}

export async function getDailyAnalytics(userId: string, date: string, timezone: string) {
  const summary = await getOrGenerateDailySummary(userId, date, timezone);
  const habitStatuses = await getUserHabitStatusesForDate(userId, date, timezone);
  return {
    summary,
    habits: habitStatuses.map((s) => ({ id: s.habit._id.toString(), name: s.habit.name, status: s.status })),
  };
}

export interface WeeklyReport {
  start: string;
  end: string;
  productivityAvg: number;
  habitsCompletionAvg: number;
  focusMinutesTotal: number;
  journalDays: number;
  totalDays: number;
  topHabit: { name: string; completionRate: number } | null;
  mostMissedHabit: { name: string; missRate: number } | null;
  bestDay: { date: string; score: number } | null;
  worstDay: { date: string; score: number } | null;
  dailyScores: { date: string; score: number }[];
}

export async function getWeeklyReport(userId: string, anchorDate: string, timezone: string, weekStartsOn: number): Promise<WeeklyReport> {
  const start = startOfWeek(anchorDate, weekStartsOn);
  const end = endOfWeek(anchorDate, weekStartsOn);
  return buildRangeReport(userId, start, end, timezone);
}

export interface MonthlyReport extends WeeklyReport {
  goalCompletionCount: number;
  moodAvg: number | null;
  energyAvg: number | null;
  streakBest: number;
}

export async function getMonthlyReport(userId: string, anchorDate: string, timezone: string): Promise<MonthlyReport> {
  const start = startOfMonth(anchorDate);
  const end = endOfMonth(anchorDate);
  const base = await buildRangeReport(userId, start, end, timezone);

  const moods = await MoodEntry.find({ userId, date: { $gte: start, $lte: end } });
  const moodAvg = moods.length ? average(moods.map((m) => MOOD_SCORES[m.mood as Mood])) : null;
  const energyAvg = moods.length ? average(moods.map((m) => m.energy)) : null;

  const { Goal } = await import("../models/Goal");
  const goalCompletionCount = await Goal.countDocuments({
    userId,
    status: "completed",
    completedAt: { $gte: new Date(`${start}T00:00:00Z`), $lte: new Date(`${end}T23:59:59Z`) },
  });

  const habits = await Habit.find({ userId });
  const { computeHabitStreak } = await import("./streakService");
  const { getPauseRangesForHabit } = await import("./pauseService");
  const actualToday = new Date().toISOString().slice(0, 10);
  const streakReferenceDate = end < actualToday ? end : actualToday;
  let streakBest = 0;
  for (const habit of habits) {
    const pauseRanges = await getPauseRangesForHabit(userId, habit);
    const checkIns = await HabitCheckIn.find({ habitId: habit._id }).lean();
    const streak = computeHabitStreak(habit, streakReferenceDate, pauseRanges, checkIns);
    streakBest = Math.max(streakBest, streak.longest);
  }

  return { ...base, goalCompletionCount, moodAvg, energyAvg, streakBest };
}

async function buildRangeReport(userId: string, start: string, end: string, timezone: string): Promise<WeeklyReport> {
  const summaries = await summariesForRange(userId, start, end, timezone);
  const dailyScores = summaries.map((s) => ({ date: s.date, score: s.productivityScore }));

  const productivityAvg = average(summaries.map((s) => s.productivityScore));
  const habitCompletionRates = summaries
    .filter((s) => s.habitsScheduled > 0)
    .map((s) => (s.habitsCompleted / s.habitsScheduled) * 100);
  const habitsCompletionAvg = average(habitCompletionRates);
  const focusMinutesTotal = summaries.reduce((sum, s) => sum + s.focusMinutes, 0);
  const journalDays = summaries.filter((s) => s.journalCompleted).length;

  let bestDay: { date: string; score: number } | null = null;
  let worstDay: { date: string; score: number } | null = null;
  for (const s of dailyScores) {
    if (!bestDay || s.score > bestDay.score) bestDay = s;
    if (!worstDay || s.score < worstDay.score) worstDay = s;
  }

  const { topHabit, mostMissedHabit } = await getHabitExtremes(userId, start, end);

  return {
    start,
    end,
    productivityAvg,
    habitsCompletionAvg,
    focusMinutesTotal,
    journalDays,
    totalDays: summaries.length,
    topHabit,
    mostMissedHabit,
    bestDay,
    worstDay,
    dailyScores,
  };
}

async function getHabitExtremes(userId: string, start: string, end: string) {
  const habits = await Habit.find({ userId });
  const { resolveDayStatus } = await import("./dayStatusService");
  const { getUserPauseMap, getPauseRangesFromMap } = await import("./pauseService");
  const pauseMap = await getUserPauseMap(userId);
  const today = enumerateDates(start, end).at(-1)!;

  const rates: { name: string; completed: number; scheduled: number }[] = [];
  for (const habit of habits) {
    const checkIns = await HabitCheckIn.find({ habitId: habit._id, date: { $gte: start, $lte: end } }).lean();
    const checkInMap = new Map(checkIns.map((c) => [c.date, c]));
    let completed = 0;
    let scheduled = 0;
    for (const date of enumerateDates(start, end)) {
      const result = resolveDayStatus({
        habit,
        dateStr: date,
        today,
        pauseRanges: getPauseRangesFromMap(pauseMap, habit),
        checkIn: checkInMap.get(date),
      });
      if (result.scheduled) {
        scheduled += 1;
        if (result.status === "completed") completed += 1;
      }
    }
    if (scheduled > 0) rates.push({ name: habit.name, completed, scheduled });
  }

  const withRate = rates.map((r) => ({ name: r.name, rate: r.completed / r.scheduled }));
  const topHabit = withRate.length
    ? withRate.reduce((best, cur) => (cur.rate > best.rate ? cur : best))
    : null;
  const mostMissedHabit = withRate.length
    ? withRate.reduce((worst, cur) => (cur.rate < worst.rate ? cur : worst))
    : null;

  return {
    topHabit: topHabit ? { name: topHabit.name, completionRate: Math.round(topHabit.rate * 100) } : null,
    mostMissedHabit: mostMissedHabit ? { name: mostMissedHabit.name, missRate: Math.round((1 - mostMissedHabit.rate) * 100) } : null,
  };
}

export interface Insight {
  text: string;
  category: "mood" | "habit" | "time" | "sleep" | "general";
}

const MIN_SAMPLE = 5;

/** Only ever generated from real aggregates over a minimum sample size - never fabricated (rule #21). */
export async function getInsights(userId: string, timezone: string): Promise<Insight[]> {
  const insights: Insight[] = [];
  const end = new Date().toISOString().slice(0, 10);
  const start = addDays(end, -59);
  const summaries = await summariesForRange(userId, start, end, timezone);

  // Mood vs productivity
  const goodMoodDays = summaries.filter((s) => s.mood === "great" || s.mood === "good");
  const badMoodDays = summaries.filter((s) => s.mood === "bad" || s.mood === "terrible");
  if (goodMoodDays.length >= MIN_SAMPLE && badMoodDays.length >= MIN_SAMPLE) {
    const goodAvg = average(goodMoodDays.map((s) => s.productivityScore));
    const badAvg = average(badMoodDays.map((s) => s.productivityScore));
    if (goodAvg > badAvg) {
      const diff = Math.round(((goodAvg - badAvg) / Math.max(1, badAvg)) * 100);
      insights.push({ text: `Your productivity is ${diff}% higher on days you report a good mood.`, category: "mood" });
    }
  }

  // Habit consistency: least consistent habit this month, minimum sample
  const habits = await Habit.find({ userId });
  const { resolveDayStatus } = await import("./dayStatusService");
  const { getUserPauseMap, getPauseRangesFromMap } = await import("./pauseService");
  const pauseMap = await getUserPauseMap(userId);
  let leastConsistent: { name: string; rate: number; scheduled: number } | null = null;
  for (const habit of habits) {
    const checkIns = await HabitCheckIn.find({ habitId: habit._id, date: { $gte: start, $lte: end } }).lean();
    const checkInMap = new Map(checkIns.map((c) => [c.date, c]));
    let completed = 0;
    let scheduled = 0;
    for (const date of enumerateDates(start, end)) {
      const result = resolveDayStatus({ habit, dateStr: date, today: end, pauseRanges: getPauseRangesFromMap(pauseMap, habit), checkIn: checkInMap.get(date) });
      if (result.scheduled) {
        scheduled += 1;
        if (result.status === "completed") completed += 1;
      }
    }
    if (scheduled >= MIN_SAMPLE) {
      const rate = completed / scheduled;
      if (!leastConsistent || rate < leastConsistent.rate) leastConsistent = { name: habit.name, rate, scheduled };
    }
  }
  if (leastConsistent && leastConsistent.rate < 0.6) {
    insights.push({
      text: `${leastConsistent.name} is your least consistent habit recently (${Math.round(leastConsistent.rate * 100)}% completion).`,
      category: "habit",
    });
  }

  // Best time of day for focus
  const sessions = await FocusSession.find({ userId, status: "completed", date: { $gte: start, $lte: end } });
  if (sessions.length >= 10) {
    const buckets = new Map<string, number[]>();
    for (const s of sessions) {
      const { hour } = timeInTimezone(s.startTime, timezone);
      const bucket = hour < 12 ? "morning (before 12 PM)" : hour < 17 ? "afternoon (12-5 PM)" : "evening (after 5 PM)";
      buckets.set(bucket, [...(buckets.get(bucket) ?? []), s.actualDuration]);
    }
    let bestBucket: string | null = null;
    let bestTotal = -1;
    for (const [bucket, durations] of buckets) {
      const total = durations.reduce((a, b) => a + b, 0);
      if (total > bestTotal) {
        bestTotal = total;
        bestBucket = bucket;
      }
    }
    if (bestBucket) {
      insights.push({ text: `You focus the most during the ${bestBucket}.`, category: "time" });
    }
  }

  return insights;
}

export interface ProductivityProfile {
  bestProductivityTime: string | null;
  bestDayOfWeek: string | null;
  strongestHabit: string | null;
  weakestHabit: string | null;
  avgFocusMinutesPerDay: number;
  avgMood: number | null;
  avgEnergy: number | null;
  currentBestStreak: number;
  longestStreakEver: number;
  monthlyTrend: { month: string; avgScore: number }[];
}

export async function getProductivityProfile(userId: string, timezone: string): Promise<ProductivityProfile> {
  const today = new Date().toISOString().slice(0, 10);
  const start = addDays(today, -180);
  const summaries = await DailySummary.find({ userId, date: { $gte: start, $lte: today }, isFinal: true }).sort({ date: 1 });

  const byWeekday = new Map<number, number[]>();
  for (const s of summaries) {
    const dow = dayOfWeek(s.date);
    byWeekday.set(dow, [...(byWeekday.get(dow) ?? []), s.productivityScore]);
  }
  let bestDayOfWeek: string | null = null;
  let bestDowAvg = -1;
  for (const [dow, scores] of byWeekday) {
    if (scores.length < 2) continue;
    const avg = average(scores);
    if (avg > bestDowAvg) {
      bestDowAvg = avg;
      bestDayOfWeek = WEEKDAY_NAMES[dow];
    }
  }

  const sessions = await FocusSession.find({ userId, status: "completed", date: { $gte: start, $lte: today } });
  let bestProductivityTime: string | null = null;
  if (sessions.length >= 10) {
    const buckets = new Map<string, number>();
    for (const s of sessions) {
      const { hour } = timeInTimezone(s.startTime, timezone);
      const bucket = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";
      buckets.set(bucket, (buckets.get(bucket) ?? 0) + s.actualDuration);
    }
    bestProductivityTime = [...buckets.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  }

  const habits = await Habit.find({ userId });
  const { resolveDayStatus } = await import("./dayStatusService");
  const { getUserPauseMap, getPauseRangesFromMap } = await import("./pauseService");
  const { computeHabitStreak } = await import("./streakService");
  const { getPauseRangesForHabit } = await import("./pauseService");
  const pauseMap = await getUserPauseMap(userId);

  let strongest: { name: string; rate: number } | null = null;
  let weakest: { name: string; rate: number } | null = null;
  let longestStreakEver = 0;
  let currentBestStreak = 0;

  for (const habit of habits) {
    const checkIns = await HabitCheckIn.find({ habitId: habit._id }).lean();
    const checkInMap = new Map(checkIns.map((c) => [c.date, c]));
    let completed = 0;
    let scheduled = 0;
    for (const date of enumerateDates(start, today)) {
      const result = resolveDayStatus({ habit, dateStr: date, today, pauseRanges: getPauseRangesFromMap(pauseMap, habit), checkIn: checkInMap.get(date) });
      if (result.scheduled) {
        scheduled += 1;
        if (result.status === "completed") completed += 1;
      }
    }
    if (scheduled >= MIN_SAMPLE) {
      const rate = completed / scheduled;
      if (!strongest || rate > strongest.rate) strongest = { name: habit.name, rate };
      if (!weakest || rate < weakest.rate) weakest = { name: habit.name, rate };
    }

    const pauseRanges = await getPauseRangesForHabit(userId, habit);
    const streak = computeHabitStreak(habit, today, pauseRanges, checkIns);
    longestStreakEver = Math.max(longestStreakEver, streak.longest);
    currentBestStreak = Math.max(currentBestStreak, streak.current);
  }

  const moods = await MoodEntry.find({ userId, date: { $gte: start, $lte: today } });
  const avgMood = moods.length ? average(moods.map((m) => MOOD_SCORES[m.mood as Mood])) : null;
  const avgEnergy = moods.length ? average(moods.map((m) => m.energy)) : null;

  const monthlyTrend: { month: string; avgScore: number }[] = [];
  const monthMap = new Map<string, number[]>();
  for (const s of summaries) {
    const key = s.date.slice(0, 7);
    monthMap.set(key, [...(monthMap.get(key) ?? []), s.productivityScore]);
  }
  for (const [month, scores] of [...monthMap.entries()].sort()) {
    monthlyTrend.push({ month, avgScore: average(scores) });
  }

  return {
    bestProductivityTime,
    bestDayOfWeek,
    strongestHabit: strongest?.name ?? null,
    weakestHabit: weakest?.name ?? null,
    avgFocusMinutesPerDay: average(summaries.map((s) => s.focusMinutes)),
    avgMood,
    avgEnergy,
    currentBestStreak,
    longestStreakEver,
    monthlyTrend,
  };
}

