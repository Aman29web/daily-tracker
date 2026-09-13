import { IHabit } from "../models/Habit";
import { IHabitCheckIn } from "../models/HabitCheckIn";
import { addDays, enumerateDates, isBetween } from "../utils/dateUtils";
import { resolveDayStatus, PauseRange } from "./dayStatusService";
import { getPeriodBounds, isFlexibleSchedule } from "./scheduleService";

export interface StreakResult {
  current: number;
  longest: number;
  lastCompletedDate: string | null;
}

type CheckInLite = Pick<IHabitCheckIn, "status" | "value" | "note" | "date">;

function buildCheckInMap(checkIns: CheckInLite[]): Map<string, CheckInLite> {
  const map = new Map<string, CheckInLite>();
  for (const c of checkIns) map.set(c.date, c);
  return map;
}

/**
 * Fixed-cadence habits (daily / weekdays / specific_dates): walk day by day.
 * Completed scheduled occurrences extend the streak; missed/skipped
 * scheduled occurrences break it; everything else (paused, rest day, not
 * scheduled, inactive, upcoming, today-pending) is simply skipped over and
 * has no effect - this is what makes the streak "occurrence based" rather
 * than "consecutive calendar days".
 */
function computeFixedCadenceStreak(
  habit: IHabit,
  today: string,
  pauseRanges: PauseRange[],
  checkInMap: Map<string, CheckInLite>
): StreakResult {
  const dates = enumerateDates(habit.startDate, today);

  let longest = 0;
  let running = 0;
  let lastCompletedDate: string | null = null;

  const dayResults: { date: string; status: string }[] = [];
  for (const date of dates) {
    const result = resolveDayStatus({ habit, dateStr: date, today, pauseRanges, checkIn: checkInMap.get(date) });
    dayResults.push({ date, status: result.status });

    if (result.status === "completed") {
      running += 1;
      longest = Math.max(longest, running);
      lastCompletedDate = date;
    } else if (result.status === "missed" || result.status === "skipped") {
      running = 0;
    }
    // paused / rest_day / not_scheduled / inactive / upcoming / pending -> no effect on `running`
  }

  // Current streak: walk backwards from the end until a break (missed/skipped) is hit.
  let current = 0;
  for (let i = dayResults.length - 1; i >= 0; i--) {
    const { status } = dayResults[i];
    if (status === "completed") current += 1;
    else if (status === "missed" || status === "skipped") break;
    // else: paused/rest/not_scheduled/inactive/upcoming/pending -> keep walking backwards
  }

  return { current, longest, lastCompletedDate };
}

/**
 * Flexible habits (x_per_week / x_per_month): no single day is mandatory,
 * so streak is measured in consecutive successful PERIODS (weeks/months)
 * where completed check-ins met the period target. A period that hasn't
 * ended yet is left un-judged; a period that is entirely covered by a pause
 * is skipped like a rest day.
 */
function computeFlexibleStreak(
  habit: IHabit,
  today: string,
  pauseRanges: PauseRange[],
  checkInMap: Map<string, CheckInLite>,
  weekStartsOn: number
): StreakResult {
  const periods: { start: string; end: string }[] = [];
  let cursor = habit.startDate;
  const seen = new Set<string>();
  while (cursor <= today) {
    const schedule = habit.currentSchedule(cursor);
    if (!schedule) {
      cursor = addDays(cursor, 1);
      continue;
    }
    const bounds = getPeriodBounds(schedule, cursor, weekStartsOn);
    const key = `${bounds.start}_${bounds.end}`;
    if (!seen.has(key)) {
      seen.add(key);
      periods.push(bounds);
    }
    cursor = addDays(bounds.end, 1);
  }

  const target = habit.scheduleHistory[habit.scheduleHistory.length - 1]?.schedule.timesPerPeriod ?? 1;

  let longest = 0;
  let running = 0;
  let lastCompletedDate: string | null = null;
  const periodResults: { success: boolean | null; end: string }[] = [];

  for (const period of periods) {
    const fullyPaused = pauseRanges.some((r) => isBetween(period.start, r.start, r.end) && isBetween(period.end, r.start, r.end));
    if (fullyPaused) {
      periodResults.push({ success: null, end: period.end });
      continue;
    }
    if (period.end >= today && period.start <= today) {
      // Current, still-open period: don't judge yet.
      periodResults.push({ success: null, end: period.end });
      continue;
    }
    if (period.start > today) break;

    const schedule = habit.currentSchedule(period.start);
    const periodTarget = schedule?.timesPerPeriod ?? target;

    let completedCount = 0;
    let lastDateInPeriod: string | null = null;
    for (const date of enumerateDates(period.start, period.end > today ? today : period.end)) {
      const checkIn = checkInMap.get(date);
      const result = resolveDayStatus({ habit, dateStr: date, today, pauseRanges, checkIn });
      if (result.status === "completed") {
        completedCount += 1;
        lastDateInPeriod = date;
      }
    }

    const success = completedCount >= periodTarget;
    periodResults.push({ success, end: period.end });
    if (success) {
      running += 1;
      longest = Math.max(longest, running);
      if (lastDateInPeriod) lastCompletedDate = lastDateInPeriod;
    } else {
      running = 0;
    }
  }

  let current = 0;
  for (let i = periodResults.length - 1; i >= 0; i--) {
    const { success } = periodResults[i];
    if (success === true) current += 1;
    else if (success === false) break;
    // null (paused or open period) -> keep walking backwards
  }

  return { current, longest, lastCompletedDate };
}

export function computeHabitStreak(
  habit: IHabit,
  today: string,
  pauseRanges: PauseRange[],
  checkIns: CheckInLite[],
  weekStartsOn = 1
): StreakResult {
  const checkInMap = buildCheckInMap(checkIns);
  const latestSchedule = habit.scheduleHistory[habit.scheduleHistory.length - 1]?.schedule;

  if (latestSchedule && isFlexibleSchedule(latestSchedule)) {
    return computeFlexibleStreak(habit, today, pauseRanges, checkInMap, weekStartsOn);
  }
  return computeFixedCadenceStreak(habit, today, pauseRanges, checkInMap);
}
