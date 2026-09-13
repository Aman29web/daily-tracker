import { describe, it, expect } from "vitest";
import { describeSchedule } from "../scheduleLabel";

describe("describeSchedule", () => {
  it("describes a daily schedule", () => {
    expect(describeSchedule({ type: "daily", daysOfWeek: [], specificDates: [] })).toBe("Every day");
  });

  it("describes specific weekdays in order regardless of input order", () => {
    const label = describeSchedule({ type: "weekdays", daysOfWeek: [5, 1, 3], specificDates: [] });
    expect(label).toBe("Mon, Wed, Fri");
  });

  it("describes a flexible x-per-week schedule", () => {
    expect(describeSchedule({ type: "x_per_week", daysOfWeek: [], timesPerPeriod: 3, specificDates: [] })).toBe(
      "3x per week (your choice of days)"
    );
  });

  it("describes specific dates by count", () => {
    expect(
      describeSchedule({ type: "specific_dates", daysOfWeek: [], specificDates: ["2024-01-01", "2024-02-14"] })
    ).toBe("2 specific date(s)");
  });
});
