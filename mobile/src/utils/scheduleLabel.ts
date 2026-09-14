import { HabitSchedule } from "@/types";

const WEEKDAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function describeSchedule(schedule: HabitSchedule): string {
  switch (schedule.type) {
    case "daily":
      return "Every day";
    case "weekdays":
      return schedule.daysOfWeek.length
        ? schedule.daysOfWeek
            .slice()
            .sort()
            .map((d) => WEEKDAY_NAMES[d])
            .join(", ")
        : "No days selected";
    case "x_per_week":
      return `${schedule.timesPerPeriod ?? 1}x per week (your choice of days)`;
    case "x_per_month":
      return `${schedule.timesPerPeriod ?? 1}x per month (your choice of days)`;
    case "specific_dates":
      return schedule.specificDates.length ? `${schedule.specificDates.length} specific date(s)` : "No dates set";
    default:
      return "";
  }
}
