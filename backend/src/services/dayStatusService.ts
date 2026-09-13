import { IHabit, IHabitSchedule } from "../models/Habit";
import { IHabitCheckIn } from "../models/HabitCheckIn";
import { DayStatus } from "../types/enums";
import { isBetween } from "../utils/dateUtils";
import { isScheduledDay } from "./scheduleService";

export interface PauseRange {
  start: string;
  end: string;
}

export interface DayStatusInput {
  habit: IHabit;
  dateStr: string;
  today: string;
  pauseRanges: PauseRange[];
  checkIn?: Pick<IHabitCheckIn, "status" | "value" | "note"> | null;
}

export interface DayStatusResult {
  status: DayStatus;
  scheduled: boolean; // true if this day counts as an actionable occurrence for streak/scoring purposes
  value?: number;
  targetValue?: number;
  note?: string;
}

function isPaused(dateStr: string, ranges: PauseRange[]): boolean {
  return ranges.some((r) => isBetween(dateStr, r.start, r.end));
}

/**
 * Resolves the single source of truth for "what happened on this habit on
 * this day". Pure and side-effect free so it can be reused for a single day
 * (check-in endpoint) or looped over a date range (calendar/analytics)
 * without extra DB round-trips - callers pre-fetch the schedule version,
 * pause ranges and check-in once per habit/range.
 *
 * Priority order encodes the business rules from the spec:
 *   explicit check-in  >  paused  >  inactive  >  schedule  >  today/future
 */
export function resolveDayStatus(input: DayStatusInput): DayStatusResult {
  const { habit, dateStr, today, pauseRanges, checkIn } = input;

  const withinActiveRange =
    habit.isActive && dateStr >= habit.startDate && (!habit.endDate || dateStr <= habit.endDate);

  const schedule: IHabitSchedule | null = withinActiveRange ? habit.currentSchedule(dateStr) : null;

  const target = habit.type === "numeric" ? habit.target : undefined;

  // Numeric habits: incremental progress without an explicit status is resolved by value vs target.
  if (habit.type === "numeric" && checkIn && checkIn.value !== undefined && !checkIn.status) {
    const met = target ? checkIn.value >= target.value : false;
    if (met) {
      return { status: "completed", scheduled: true, value: checkIn.value, targetValue: target?.value, note: checkIn.note };
    }
    if (dateStr < today) {
      return { status: "missed", scheduled: true, value: checkIn.value, targetValue: target?.value, note: checkIn.note };
    }
    return { status: "pending", scheduled: true, value: checkIn.value, targetValue: target?.value, note: checkIn.note };
  }

  if (checkIn?.status) {
    return {
      status: checkIn.status,
      scheduled: true,
      value: checkIn.value,
      targetValue: target?.value,
      note: checkIn.note,
    };
  }

  if (isPaused(dateStr, pauseRanges)) {
    return { status: "paused", scheduled: false, targetValue: target?.value };
  }

  if (!withinActiveRange || !schedule) {
    return { status: "inactive", scheduled: false };
  }

  const scheduledToday = isScheduledDay(schedule, dateStr);
  if (!scheduledToday) {
    const label: DayStatus = schedule.type === "weekdays" ? "rest_day" : "not_scheduled";
    return { status: label, scheduled: false, targetValue: target?.value };
  }

  if (dateStr > today) {
    return { status: "upcoming", scheduled: true, targetValue: target?.value };
  }
  if (dateStr === today) {
    return { status: "pending", scheduled: true, targetValue: target?.value };
  }
  return { status: "missed", scheduled: true, targetValue: target?.value };
}
