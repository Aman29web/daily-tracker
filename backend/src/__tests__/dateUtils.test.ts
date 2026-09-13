import { describe, it, expect } from "vitest";
import { addDays, dayOfWeek, enumerateDates, endOfWeek, isBetween, startOfWeek, toDateString } from "../utils/dateUtils";

describe("dateUtils", () => {
  it("computes weekday for a calendar date consistently regardless of timezone", () => {
    // 2024-01-01 is a known Monday.
    expect(dayOfWeek("2024-01-01")).toBe(1);
    expect(dayOfWeek("2024-01-07")).toBe(0); // Sunday
  });

  it("adds and subtracts days across month boundaries", () => {
    expect(addDays("2024-01-31", 1)).toBe("2024-02-01");
    expect(addDays("2024-03-01", -1)).toBe("2024-02-29"); // 2024 is a leap year
  });

  it("enumerates an inclusive date range", () => {
    expect(enumerateDates("2024-01-01", "2024-01-03")).toEqual(["2024-01-01", "2024-01-02", "2024-01-03"]);
  });

  it("computes week bounds respecting weekStartsOn", () => {
    expect(startOfWeek("2024-01-03", 1)).toBe("2024-01-01"); // Wed -> Monday
    expect(endOfWeek("2024-01-03", 1)).toBe("2024-01-07"); // -> Sunday
  });

  it("checks inclusive date range membership", () => {
    expect(isBetween("2024-01-05", "2024-01-01", "2024-01-10")).toBe(true);
    expect(isBetween("2024-01-05", "2024-01-06", "2024-01-10")).toBe(false);
    expect(isBetween("2024-01-05", "2024-01-01", null)).toBe(true);
  });

  it("formats a Date into a timezone-local YYYY-MM-DD", () => {
    // 2024-01-01T02:00:00Z is still 2023-12-31 in US/Pacific (UTC-8 in January).
    const date = new Date("2024-01-01T02:00:00Z");
    expect(toDateString(date, "UTC")).toBe("2024-01-01");
    expect(toDateString(date, "America/Los_Angeles")).toBe("2023-12-31");
  });
});
