import { describe, it, expect } from "vitest";
import { addDaysStr, dayOfWeek, formatMinutes } from "../date";

describe("date utils", () => {
  it("formats minutes into a compact h/m label", () => {
    expect(formatMinutes(0)).toBe("0m");
    expect(formatMinutes(45)).toBe("45m");
    expect(formatMinutes(60)).toBe("1h");
    expect(formatMinutes(95)).toBe("1h 35m");
  });

  it("adds days across month/year boundaries", () => {
    expect(addDaysStr("2024-01-31", 1)).toBe("2024-02-01");
    expect(addDaysStr("2024-12-31", 1)).toBe("2025-01-01");
  });

  it("computes weekday consistently for a calendar date", () => {
    expect(dayOfWeek("2024-01-01")).toBe(1); // known Monday
  });
});
