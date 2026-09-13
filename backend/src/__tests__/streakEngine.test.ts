import { describe, it, expect, beforeEach } from "vitest";
import { Types } from "mongoose";
import { Habit } from "../models/Habit";
import { HabitCheckIn } from "../models/HabitCheckIn";
import { computeHabitStreak } from "../services/streakService";
import { resolveDayStatus } from "../services/dayStatusService";

const userId = new Types.ObjectId();

async function makeGymHabit() {
  return Habit.create({
    userId,
    name: "Gym",
    icon: "dumbbell",
    color: "#000",
    category: "fitness",
    type: "boolean",
    priority: "medium",
    startDate: "2024-01-01",
    isActive: true,
    scheduleHistory: [
      {
        schedule: { type: "weekdays", daysOfWeek: [1, 3, 5], specificDates: [] }, // Mon/Wed/Fri
        effectiveFrom: "2024-01-01",
        effectiveTo: null,
      },
    ],
  });
}

describe("occurrence-based streak engine (spec section 9)", () => {
  let habit: Awaited<ReturnType<typeof makeGymHabit>>;

  beforeEach(async () => {
    habit = await makeGymHabit();
  });

  it("does not let a non-scheduled day (Tuesday) break the streak", async () => {
    // Complete Mon Jan 1 and Wed Jan 3; Tuesday Jan 2 has no check-in at all.
    await HabitCheckIn.create({ userId, habitId: habit._id, date: "2024-01-01", status: "completed" });
    await HabitCheckIn.create({ userId, habitId: habit._id, date: "2024-01-03", status: "completed" });

    const checkIns = await HabitCheckIn.find({ habitId: habit._id }).lean();
    // "Today" = Jan 3 itself (Wednesday), so nothing after it has resolved as missed yet.
    const streak = computeHabitStreak(habit, "2024-01-03", [], checkIns);
    expect(streak.current).toBe(2);
    expect(streak.longest).toBe(2);
  });

  it("breaks the streak on a missed SCHEDULED occurrence (Friday), matching the spec example", async () => {
    await HabitCheckIn.create({ userId, habitId: habit._id, date: "2024-01-01", status: "completed" }); // Mon
    await HabitCheckIn.create({ userId, habitId: habit._id, date: "2024-01-03", status: "completed" }); // Wed
    // Friday Jan 5 has no check-in and today has moved past it -> resolves to "missed".

    const checkIns = await HabitCheckIn.find({ habitId: habit._id }).lean();
    const today = "2024-01-08"; // following Monday
    const streak = computeHabitStreak(habit, today, [], checkIns);

    expect(streak.longest).toBe(2); // Mon + Wed before the break
    expect(streak.current).toBe(0); // Friday's miss broke it, and nothing since has completed

    const fridayStatus = resolveDayStatus({ habit, dateStr: "2024-01-05", today, pauseRanges: [], checkIn: undefined });
    expect(fridayStatus.status).toBe("missed");

    const tuesdayStatus = resolveDayStatus({ habit, dateStr: "2024-01-02", today, pauseRanges: [], checkIn: undefined });
    expect(tuesdayStatus.status).toBe("rest_day");
    expect(tuesdayStatus.scheduled).toBe(false);
  });

  it("protects the streak through a paused (vacation) window instead of breaking it", async () => {
    await HabitCheckIn.create({ userId, habitId: habit._id, date: "2024-01-01", status: "completed" }); // Mon

    // Pause covers Wed Jan 3 through Fri Jan 5 - those scheduled occurrences must not count as missed.
    const pauseRanges = [{ start: "2024-01-03", end: "2024-01-05" }];
    const checkIns = await HabitCheckIn.find({ habitId: habit._id }).lean();
    const today = "2024-01-08";
    const streak = computeHabitStreak(habit, today, pauseRanges, checkIns);

    expect(streak.current).toBe(1); // still protected, only Monday counted
    expect(streak.longest).toBe(1);

    const wednesdayStatus = resolveDayStatus({ habit, dateStr: "2024-01-03", today, pauseRanges, checkIn: undefined });
    expect(wednesdayStatus.status).toBe("paused");
  });

  it("never rewrites historical occurrences when the schedule changes later", async () => {
    // Change schedule from Mon/Wed/Fri to Mon/Thu starting 2024-01-08.
    const current = habit.scheduleHistory.find((v) => !v.effectiveTo)!;
    current.effectiveTo = "2024-01-07";
    habit.scheduleHistory.push({
      schedule: { type: "weekdays", daysOfWeek: [1, 4], specificDates: [] },
      effectiveFrom: "2024-01-08",
      effectiveTo: null,
    });
    await habit.save();

    // Jan 5 (Friday) is still evaluated against the OLD schedule (was scheduled) -> missed if uncompleted.
    const oldFriday = resolveDayStatus({ habit, dateStr: "2024-01-05", today: "2024-01-10", pauseRanges: [], checkIn: undefined });
    expect(oldFriday.status).toBe("missed");

    // Jan 12 (Friday) is evaluated against the NEW schedule (not scheduled anymore).
    const newFriday = resolveDayStatus({ habit, dateStr: "2024-01-12", today: "2024-01-12", pauseRanges: [], checkIn: undefined });
    expect(newFriday.status).toBe("rest_day");

    // Jan 11 (Thursday) is newly scheduled under the new version.
    const newThursday = resolveDayStatus({ habit, dateStr: "2024-01-11", today: "2024-01-12", pauseRanges: [], checkIn: undefined });
    expect(newThursday.scheduled).toBe(true);
  });

  it("treats numeric habit progress below target as missed once the day has passed, completed once target is met", async () => {
    const water = await Habit.create({
      userId,
      name: "Water",
      icon: "droplet",
      color: "#000",
      category: "health",
      type: "numeric",
      target: { value: 8, unit: "glasses" },
      priority: "medium",
      startDate: "2024-01-01",
      isActive: true,
      scheduleHistory: [{ schedule: { type: "daily", daysOfWeek: [], specificDates: [] }, effectiveFrom: "2024-01-01", effectiveTo: null }],
    });

    const partial = resolveDayStatus({
      habit: water,
      dateStr: "2024-01-01",
      today: "2024-01-02",
      pauseRanges: [],
      checkIn: { status: undefined, value: 5, note: undefined },
    });
    expect(partial.status).toBe("missed");
    expect(partial.value).toBe(5);

    const met = resolveDayStatus({
      habit: water,
      dateStr: "2024-01-01",
      today: "2024-01-02",
      pauseRanges: [],
      checkIn: { status: undefined, value: 8, note: undefined },
    });
    expect(met.status).toBe("completed");
  });
});
