import { describe, it, expect } from "vitest";
import { Types } from "mongoose";
import { computeDailyProductivityScore } from "../services/productivityScoreService";
import { Habit } from "../models/Habit";
import { HabitCheckIn } from "../models/HabitCheckIn";

describe("productivity score", () => {
  it("scores a brand-new account with nothing set up as 0%, not a fabricated neutral high score", async () => {
    const userId = new Types.ObjectId().toString();
    const breakdown = await computeDailyProductivityScore(userId, "2024-01-01", "UTC");
    expect(breakdown.score).toBe(0);
  });

  it("does not penalize a legitimate rest day for a user who does have other habits", async () => {
    const userId = new Types.ObjectId();

    // One habit scheduled and completed today...
    const gym = await Habit.create({
      userId,
      name: "Gym",
      icon: "dumbbell",
      color: "#000",
      category: "fitness",
      type: "boolean",
      priority: "medium",
      startDate: "2024-01-01",
      isActive: true,
      scheduleHistory: [{ schedule: { type: "daily", daysOfWeek: [], specificDates: [] }, effectiveFrom: "2024-01-01", effectiveTo: null }],
    });
    await HabitCheckIn.create({ userId, habitId: gym._id, date: "2024-01-01", status: "completed" });

    // ...another habit that simply isn't scheduled today (Tue/Thu only, and 2024-01-01 is a Monday).
    await Habit.create({
      userId,
      name: "Reading",
      icon: "book-open",
      color: "#000",
      category: "learning",
      type: "boolean",
      priority: "medium",
      startDate: "2024-01-01",
      isActive: true,
      scheduleHistory: [{ schedule: { type: "weekdays", daysOfWeek: [2, 4], specificDates: [] }, effectiveFrom: "2024-01-01", effectiveTo: null }],
    });

    const breakdown = await computeDailyProductivityScore(userId.toString(), "2024-01-01", "UTC");
    // Only the habits component applies (1/1 scheduled occurrence completed); no tasks/top3/focus
    // exist or were logged, so none of them drag down a day where everything expected got done.
    expect(breakdown.habits.score).toBe(100);
    expect(breakdown.habits.scheduled).toBe(1); // Reading's non-scheduled day correctly excluded
    expect(breakdown.score).toBe(100);
  });

  it("scores a perfect day as 100% even with zero focus minutes logged", async () => {
    const userId = new Types.ObjectId();
    for (const name of ["Habit A", "Habit B"]) {
      const habit = await Habit.create({
        userId,
        name,
        icon: "target",
        color: "#000",
        category: "general",
        type: "boolean",
        priority: "medium",
        startDate: "2024-01-01",
        isActive: true,
        scheduleHistory: [{ schedule: { type: "daily", daysOfWeek: [], specificDates: [] }, effectiveFrom: "2024-01-01", effectiveTo: null }],
      });
      await HabitCheckIn.create({ userId, habitId: habit._id, date: "2024-01-01", status: "completed" });
    }

    const breakdown = await computeDailyProductivityScore(userId.toString(), "2024-01-01", "UTC");
    expect(breakdown.habits.completed).toBe(2);
    expect(breakdown.focus.minutes).toBe(0);
    expect(breakdown.score).toBe(100);
  });

  it("scores purely on habit completion - an incomplete task/top3 no longer drags the score down", async () => {
    const userId = new Types.ObjectId();
    const habit = await Habit.create({
      userId,
      name: "Gym",
      icon: "dumbbell",
      color: "#000",
      category: "fitness",
      type: "boolean",
      priority: "medium",
      startDate: "2024-01-01",
      isActive: true,
      scheduleHistory: [{ schedule: { type: "daily", daysOfWeek: [], specificDates: [] }, effectiveFrom: "2024-01-01", effectiveTo: null }],
    });
    await HabitCheckIn.create({ userId, habitId: habit._id, date: "2024-01-01", status: "completed" });

    const { Task } = await import("../models/Task");
    await Task.create({
      userId,
      title: "fdb",
      priority: "medium",
      status: "in_progress",
      category: "general",
      dueDate: "2024-01-01",
      isTop3: true,
      top3Date: "2024-01-01",
      order: 0,
    });

    const breakdown = await computeDailyProductivityScore(userId.toString(), "2024-01-01", "UTC");
    expect(breakdown.tasks.total).toBe(1);
    expect(breakdown.tasks.completed).toBe(0);
    expect(breakdown.top3.total).toBe(1);
    expect(breakdown.top3.completed).toBe(0);
    // Habits are 1/1 complete - the open task/top3 item is still reported, but no longer affects `score`.
    expect(breakdown.score).toBe(100);
  });

  it("scores a rest day (habits exist, none scheduled today) as neutral 100%", async () => {
    const userId = new Types.ObjectId();
    await Habit.create({
      userId,
      name: "Gym",
      icon: "dumbbell",
      color: "#000",
      category: "fitness",
      type: "boolean",
      priority: "medium",
      startDate: "2024-01-01",
      isActive: true,
      // 2024-01-01 is a Monday; only scheduled Tue/Thu.
      scheduleHistory: [{ schedule: { type: "weekdays", daysOfWeek: [2, 4], specificDates: [] }, effectiveFrom: "2024-01-01", effectiveTo: null }],
    });

    const breakdown = await computeDailyProductivityScore(userId.toString(), "2024-01-01", "UTC");
    expect(breakdown.habits.scheduled).toBe(0);
    expect(breakdown.score).toBe(100);
  });

  it("does not retroactively score 100% for days before the user's first habit existed", async () => {
    const userId = new Types.ObjectId();
    await Habit.create({
      userId,
      name: "Gym",
      icon: "dumbbell",
      color: "#000",
      category: "fitness",
      type: "boolean",
      priority: "medium",
      startDate: "2024-01-15", // habit created "today" (Jan 15)
      isActive: true,
      scheduleHistory: [{ schedule: { type: "daily", daysOfWeek: [], specificDates: [] }, effectiveFrom: "2024-01-15", effectiveTo: null }],
    });

    // Jan 10 is before this user ever had a habit - there was nothing to be neutral about.
    const before = await computeDailyProductivityScore(userId.toString(), "2024-01-10", "UTC");
    expect(before.habits.scheduled).toBe(0);
    expect(before.score).toBe(0);

    // Jan 15 itself (the habit's first day) scores normally.
    const startDay = await computeDailyProductivityScore(userId.toString(), "2024-01-15", "UTC");
    expect(startDay.habits.scheduled).toBe(1);
  });
});
