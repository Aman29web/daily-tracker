/* eslint-disable no-console */
import { connectDB, disconnectDB } from "../config/db";
import { User } from "../models/User";
import { UserSettings } from "../models/UserSettings";
import { Habit } from "../models/Habit";
import { HabitCheckIn } from "../models/HabitCheckIn";
import { Plan } from "../models/Plan";
import { Task } from "../models/Task";
import { Goal } from "../models/Goal";
import { JournalEntry } from "../models/JournalEntry";
import { MoodEntry } from "../models/MoodEntry";
import { FocusSession } from "../models/FocusSession";
import { hashPassword } from "../services/authService";
import { addDays, dayOfWeek, enumerateDates } from "../utils/dateUtils";
import { generateDailySummary } from "../services/dailySummaryService";
import { evaluateAchievementsForUser, ensureAchievementCatalog } from "../services/achievementService";
import { MOODS } from "../types/enums";

const DEMO_EMAIL = "demo@tracker.app";
const TIMEZONE = "America/New_York";

async function seed() {
  await connectDB();
  await ensureAchievementCatalog();

  console.log("Clearing existing demo data...");
  const existing = await User.findOne({ email: DEMO_EMAIL });
  if (existing) {
    const userId = existing._id;
    await Promise.all([
      Habit.deleteMany({ userId }),
      HabitCheckIn.deleteMany({ userId }),
      Plan.deleteMany({ userId }),
      Task.deleteMany({ userId }),
      Goal.deleteMany({ userId }),
      JournalEntry.deleteMany({ userId }),
      MoodEntry.deleteMany({ userId }),
      FocusSession.deleteMany({ userId }),
      UserSettings.deleteMany({ userId }),
      User.deleteOne({ _id: userId }),
    ]);
  }

  console.log("Creating demo user...");
  const user = await User.create({
    name: "Alex Morgan",
    email: DEMO_EMAIL,
    passwordHash: await hashPassword("Demo1234!"),
    timezone: TIMEZONE,
    avatarColor: "#6366f1",
  });
  await UserSettings.create({ userId: user._id });

  const today = new Date().toISOString().slice(0, 10);
  const historyStart = addDays(today, -60);

  console.log("Creating plans...");
  const fitnessPlan = await Plan.create({
    userId: user._id,
    name: "Fitness Plan",
    description: "Build strength and stay active",
    category: "fitness",
    icon: "dumbbell",
    color: "#f97316",
    isActive: true,
  });
  const learningPlan = await Plan.create({
    userId: user._id,
    name: "Learning Plan",
    description: "Grow as an engineer",
    category: "learning",
    icon: "book-open",
    color: "#3b82f6",
    isActive: true,
  });

  console.log("Creating habits...");
  const habitDefs = [
    {
      name: "Gym",
      icon: "dumbbell",
      color: "#f97316",
      category: "fitness",
      type: "boolean" as const,
      priority: "high" as const,
      planId: fitnessPlan._id,
      schedule: { type: "weekdays" as const, daysOfWeek: [1, 3, 5], specificDates: [] },
    },
    {
      name: "8k Steps",
      icon: "footprints",
      color: "#22c55e",
      category: "fitness",
      type: "numeric" as const,
      target: { value: 8000, unit: "steps" },
      priority: "medium" as const,
      planId: fitnessPlan._id,
      schedule: { type: "daily" as const, daysOfWeek: [], specificDates: [] },
    },
    {
      name: "Drink Water",
      icon: "droplet",
      color: "#06b6d4",
      category: "health",
      type: "numeric" as const,
      target: { value: 8, unit: "glasses" },
      priority: "low" as const,
      schedule: { type: "daily" as const, daysOfWeek: [], specificDates: [] },
    },
    {
      name: "Coding Practice",
      icon: "code",
      color: "#3b82f6",
      category: "learning",
      type: "numeric" as const,
      target: { value: 60, unit: "minutes" },
      priority: "high" as const,
      planId: learningPlan._id,
      schedule: { type: "daily" as const, daysOfWeek: [], specificDates: [] },
    },
    {
      name: "System Design Reading",
      icon: "book-open",
      color: "#8b5cf6",
      category: "learning",
      type: "boolean" as const,
      priority: "medium" as const,
      planId: learningPlan._id,
      schedule: { type: "weekdays" as const, daysOfWeek: [1, 3, 5], specificDates: [] },
    },
    {
      name: "Meditation",
      icon: "brain",
      color: "#ec4899",
      category: "wellness",
      type: "boolean" as const,
      priority: "medium" as const,
      schedule: { type: "weekdays" as const, daysOfWeek: [1, 2, 3, 4, 5], specificDates: [] },
    },
    {
      name: "Sleep Before 11 PM",
      icon: "moon",
      color: "#6366f1",
      category: "wellness",
      type: "boolean" as const,
      priority: "medium" as const,
      schedule: { type: "daily" as const, daysOfWeek: [], specificDates: [] },
    },
  ];

  const habits = [];
  for (const def of habitDefs) {
    const habit = await Habit.create({
      userId: user._id,
      name: def.name,
      icon: def.icon,
      color: def.color,
      category: def.category,
      type: def.type,
      target: "target" in def ? def.target : undefined,
      priority: def.priority,
      startDate: historyStart,
      isActive: true,
      planId: def.planId ?? null,
      scheduleHistory: [{ schedule: def.schedule, effectiveFrom: historyStart, effectiveTo: null }],
    });
    habits.push(habit);
  }

  console.log("Generating 60 days of realistic check-in history...");
  const dates = enumerateDates(historyStart, addDays(today, -1));
  for (const habit of habits) {
    const schedule = habit.scheduleHistory[0].schedule;
    for (const date of dates) {
      const scheduled =
        schedule.type === "daily" || (schedule.type === "weekdays" && schedule.daysOfWeek.includes(dayOfWeek(date)));
      if (!scheduled) continue;

      const completionChance = 0.78;
      const didComplete = Math.random() < completionChance;
      if (!didComplete) continue;

      if (habit.type === "numeric" && habit.target) {
        const value = Math.round(habit.target.value * (0.7 + Math.random() * 0.5));
        await HabitCheckIn.create({ userId: user._id, habitId: habit._id, date, value, completedAt: new Date(`${date}T08:00:00Z`) });
      } else {
        await HabitCheckIn.create({
          userId: user._id,
          habitId: habit._id,
          date,
          status: "completed",
          completedAt: new Date(`${date}T07:30:00Z`),
        });
      }
    }
  }

  console.log("Creating goals...");
  await Goal.create({
    userId: user._id,
    title: "Master System Design",
    description: "Study system design consistently",
    category: "learning",
    targetValue: 100,
    currentValue: 42,
    unit: "hours",
    progressSource: "manual",
    deadline: addDays(today, 45),
    status: "active",
  });
  await Goal.create({
    userId: user._id,
    title: "Run a 10k",
    description: "Build up endurance",
    category: "fitness",
    targetValue: 10,
    currentValue: 6,
    unit: "km",
    progressSource: "manual",
    deadline: addDays(today, 30),
    status: "active",
  });

  console.log("Creating tasks...");
  const taskTitles = [
    { title: "Finish API integration", priority: "high", status: "in_progress" },
    { title: "Go to gym", priority: "high", status: "todo" },
    { title: "Study system design", priority: "medium", status: "todo" },
    { title: "Review pull requests", priority: "medium", status: "completed" },
    { title: "Write weekly report", priority: "low", status: "todo" },
  ] as const;
  const createdTasks = [];
  for (let i = 0; i < taskTitles.length; i++) {
    const t = taskTitles[i];
    const task = await Task.create({
      userId: user._id,
      title: t.title,
      priority: t.priority,
      status: t.status,
      category: "general",
      dueDate: today,
      order: i,
      completedAt: t.status === "completed" ? new Date() : null,
    });
    createdTasks.push(task);
  }
  await Task.updateMany(
    { _id: { $in: createdTasks.slice(0, 3).map((t) => t._id) } },
    { $set: { isTop3: true, top3Date: today } }
  );

  console.log("Creating journal + mood history...");
  for (const date of dates.slice(-14)) {
    const mood = MOODS[Math.floor(Math.random() * MOODS.length)];
    const energy = Math.round(40 + Math.random() * 60);
    await MoodEntry.create({ userId: user._id, date, mood, energy });
    if (Math.random() < 0.6) {
      await JournalEntry.create({
        userId: user._id,
        date,
        wentWell: "Stayed consistent with morning habits.",
        wentWrong: "Got distracted in the afternoon.",
        learned: "Deep work blocks work best before noon.",
        improveTomorrow: "Plan tomorrow's top 3 the night before.",
        mood,
        energy,
        tags: ["reflection"],
      });
    }
  }

  console.log("Creating focus sessions...");
  for (const date of dates.slice(-20)) {
    const sessionsToday = Math.floor(Math.random() * 3);
    for (let i = 0; i < sessionsToday; i++) {
      const duration = [25, 25, 50][Math.floor(Math.random() * 3)];
      const start = new Date(`${date}T${String(9 + i * 2).padStart(2, "0")}:00:00Z`);
      await FocusSession.create({
        userId: user._id,
        mode: String(duration) === "50" ? "50" : "25",
        plannedDuration: duration,
        actualDuration: duration,
        startTime: start,
        endTime: new Date(start.getTime() + duration * 60000),
        status: "completed",
        category: "deep-work",
        date,
      });
    }
  }

  console.log("Generating daily summaries for the last 30 days...");
  for (const date of dates.slice(-30)) {
    await generateDailySummary(user._id.toString(), date, TIMEZONE);
  }

  console.log("Evaluating achievements...");
  await evaluateAchievementsForUser(user._id.toString(), TIMEZONE);

  console.log("\nSeed complete.");
  console.log(`Demo login -> email: ${DEMO_EMAIL}  password: Demo1234!`);

  await disconnectDB();
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed", err);
  process.exit(1);
});
