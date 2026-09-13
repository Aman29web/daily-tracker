import { getOrGenerateDailySummary, getSummariesInRange } from "./dailySummaryService";
import { getUserHabitStatusesForDate } from "./habitService";
import { getTop3Completion } from "./taskService";
import { JournalEntry } from "../models/JournalEntry";
import { MoodEntry } from "../models/MoodEntry";
import { Task } from "../models/Task";
import { enumerateDates, todayInTimezone } from "../utils/dateUtils";
import { IDailySummary } from "../models/DailySummary";

/**
 * Month/week heatmap data: one row per day, backed by DailySummary
 * (generated on the fly for days without a cached row yet, e.g. today).
 * Dates after "today" haven't happened, so they carry no real habit/task/
 * focus data - scoring them would either read as 0% (unfairly bleak) or,
 * as happened before this guard existed, as a misleading flat non-zero
 * score from neutral-default components (no tasks due, no focus goal met
 * yet) outweighing a zeroed-out habit component. They're reported with
 * `hasData: false` instead so the UI can render them as blank.
 */
export async function getCalendarRange(userId: string, start: string, end: string, timezone: string) {
  const today = todayInTimezone(timezone);
  const cached = await getSummariesInRange(userId, start, end);
  const cachedMap = new Map(cached.map((s) => [s.date, s]));

  const days = await Promise.all(
    enumerateDates(start, end).map(async (date) => {
      if (date > today) {
        return {
          date,
          productivityScore: 0,
          habitsScheduled: 0,
          habitsCompleted: 0,
          habitsMissed: 0,
          habitsPaused: 0,
          focusMinutes: 0,
          mood: null,
          journalCompleted: false,
          hasData: false,
        };
      }

      const existing = cachedMap.get(date);
      const summary: IDailySummary = existing?.isFinal ? existing : await getOrGenerateDailySummary(userId, date, timezone);
      return {
        date: summary.date,
        productivityScore: summary.productivityScore,
        habitsScheduled: summary.habitsScheduled,
        habitsCompleted: summary.habitsCompleted,
        habitsMissed: summary.habitsMissed,
        habitsPaused: summary.habitsPaused,
        focusMinutes: summary.focusMinutes,
        mood: summary.mood,
        journalCompleted: summary.journalCompleted,
        hasData: true,
      };
    })
  );

  return days;
}

export async function getDayDetail(userId: string, date: string, timezone: string) {
  const [summary, habitStatuses, top3, journal, mood, tasksDue] = await Promise.all([
    getOrGenerateDailySummary(userId, date, timezone),
    getUserHabitStatusesForDate(userId, date, timezone),
    getTop3Completion(userId, date),
    JournalEntry.findOne({ userId, date }),
    MoodEntry.findOne({ userId, date }),
    Task.find({ userId, dueDate: date }),
  ]);

  return {
    date,
    summary,
    habits: habitStatuses.map((s) => ({
      id: s.habit._id.toString(),
      name: s.habit.name,
      icon: s.habit.icon,
      color: s.habit.color,
      status: s.status,
      value: s.value,
      targetValue: s.targetValue,
    })),
    top3,
    tasks: tasksDue,
    journal,
    mood: mood ? { mood: mood.mood, energy: mood.energy } : null,
  };
}
