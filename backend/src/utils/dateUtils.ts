/**
 * Timezone-aware date helpers.
 *
 * A "date string" throughout this codebase is a calendar day in the form
 * "YYYY-MM-DD". Once a calendar day is extracted from a timestamp using the
 * user's IANA timezone, all further arithmetic (weekday, +/- days, ranges)
 * is timezone-agnostic: a calendar date's weekday never changes, so we parse
 * it as UTC-midnight to avoid a second timezone conversion.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

export function isValidTimezone(timezone: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

/** Convert a Date/timestamp into a "YYYY-MM-DD" calendar date in the given timezone. */
export function toDateString(date: Date, timezone: string): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(date); // en-CA formats as YYYY-MM-DD
}

export function todayInTimezone(timezone: string): string {
  return toDateString(new Date(), timezone);
}

/** Time-of-day (0-23 hour, 0-59 minute) of the given instant in the given timezone. */
export function timeInTimezone(date: Date, timezone: string): { hour: number; minute: number } {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "numeric",
    minute: "numeric",
    hourCycle: "h23",
  });
  const parts = formatter.formatToParts(date);
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? "0");
  return { hour, minute };
}

export function currentTimeInTimezone(timezone: string): { hour: number; minute: number } {
  return timeInTimezone(new Date(), timezone);
}

function parseAsUTCMidnight(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00.000Z`);
}

/** 0 = Sunday ... 6 = Saturday, matching JS Date#getDay conventions. */
export function dayOfWeek(dateStr: string): number {
  return parseAsUTCMidnight(dateStr).getUTCDay();
}

export function addDays(dateStr: string, days: number): string {
  const d = parseAsUTCMidnight(dateStr);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function diffInDays(fromDateStr: string, toDateStr: string): number {
  const from = parseAsUTCMidnight(fromDateStr).getTime();
  const to = parseAsUTCMidnight(toDateStr).getTime();
  return Math.round((to - from) / DAY_MS);
}

export function isBefore(a: string, b: string): boolean {
  return a < b;
}
export function isAfter(a: string, b: string): boolean {
  return a > b;
}
export function isSameOrBefore(a: string, b: string): boolean {
  return a <= b;
}
export function isSameOrAfter(a: string, b: string): boolean {
  return a >= b;
}
export function isBetween(dateStr: string, start: string, end?: string | null): boolean {
  if (isBefore(dateStr, start)) return false;
  if (end && isAfter(dateStr, end)) return false;
  return true;
}

/** Inclusive list of "YYYY-MM-DD" strings from start to end. */
export function enumerateDates(start: string, end: string): string[] {
  const dates: string[] = [];
  let cursor = start;
  while (isSameOrBefore(cursor, end)) {
    dates.push(cursor);
    cursor = addDays(cursor, 1);
  }
  return dates;
}

export function startOfWeek(dateStr: string, weekStartsOn: number = 1): string {
  const dow = dayOfWeek(dateStr);
  const diff = (dow - weekStartsOn + 7) % 7;
  return addDays(dateStr, -diff);
}

export function endOfWeek(dateStr: string, weekStartsOn: number = 1): string {
  return addDays(startOfWeek(dateStr, weekStartsOn), 6);
}

export function startOfMonth(dateStr: string): string {
  return `${dateStr.slice(0, 7)}-01`;
}

export function endOfMonth(dateStr: string): string {
  const [year, month] = dateStr.split("-").map(Number);
  const last = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return `${dateStr.slice(0, 7)}-${String(last).padStart(2, "0")}`;
}

export function monthKey(dateStr: string): string {
  return dateStr.slice(0, 7);
}

export function isValidDateString(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(parseAsUTCMidnight(value).getTime());
}
