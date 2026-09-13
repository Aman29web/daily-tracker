import { IHabitSchedule } from "../models/Habit";
import { dayOfWeek, endOfMonth, endOfWeek, startOfMonth, startOfWeek } from "../utils/dateUtils";

export interface PeriodBounds {
  start: string;
  end: string;
}

/** x_per_week / x_per_month habits are "flexible": no single day is mandatory, only a period total. */
export function isFlexibleSchedule(schedule: IHabitSchedule): boolean {
  return schedule.type === "x_per_week" || schedule.type === "x_per_month";
}

/**
 * Whether a fixed-cadence habit is scheduled on this exact calendar day.
 * Not meaningful for flexible (x_per_*) schedules - use getPeriodBounds +
 * a check-in count comparison for those instead.
 */
export function isScheduledDay(schedule: IHabitSchedule, dateStr: string): boolean {
  switch (schedule.type) {
    case "daily":
      return true;
    case "weekdays":
      return schedule.daysOfWeek.includes(dayOfWeek(dateStr));
    case "specific_dates":
      return schedule.specificDates.includes(dateStr);
    case "x_per_week":
    case "x_per_month":
      return true;
    default:
      return false;
  }
}

export function getPeriodBounds(schedule: IHabitSchedule, dateStr: string, weekStartsOn: number): PeriodBounds {
  if (schedule.type === "x_per_week") {
    return { start: startOfWeek(dateStr, weekStartsOn), end: endOfWeek(dateStr, weekStartsOn) };
  }
  return { start: startOfMonth(dateStr), end: endOfMonth(dateStr) };
}
