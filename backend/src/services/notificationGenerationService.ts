import { User } from "../models/User";
import { UserSettings } from "../models/UserSettings";
import { Habit } from "../models/Habit";
import { HabitCheckIn } from "../models/HabitCheckIn";
import { Goal } from "../models/Goal";
import { Task } from "../models/Task";
import { NotificationService } from "../notifications/NotificationService";
import { currentTimeInTimezone, diffInDays, todayInTimezone } from "../utils/dateUtils";
import { getUserHabitStatusesForDate } from "./habitService";
import { computeHabitStreak } from "./streakService";
import { getPauseRangesForHabit } from "./pauseService";

function timeMatches(hour: number, minute: number, target: string): boolean {
  const [h, m] = target.split(":").map(Number);
  return hour === h && minute >= m && minute < m + 15; // fires once inside the 15-minute generation window
}

/**
 * Runs on a ~15 minute cron tick. For every user, checks their local
 * clock against their notification preferences and enqueues at most one of
 * each reminder type per day. Habit-specific reminders are skipped while
 * that habit (or its plan) is paused, satisfying "no reminders should
 * trigger" during vacation mode (rule #8).
 */
export async function generateScheduledNotifications(): Promise<number> {
  const users = await User.find().select("timezone");
  let created = 0;

  for (const user of users) {
    const userId = user._id.toString();
    const { hour, minute } = currentTimeInTimezone(user.timezone);
    const today = todayInTimezone(user.timezone);
    const settings = await UserSettings.findOne({ userId: user._id });
    const prefs = settings?.notificationPreferences;
    if (!prefs) continue;

    if (prefs.morningReminder.enabled && timeMatches(hour, minute, prefs.morningReminder.time)) {
      if (!(await NotificationService.existsToday(userId, "morning_reminder", today))) {
        await NotificationService.create({
          userId,
          type: "morning_reminder",
          title: "Good morning",
          body: "Make today count. Check your habits and top 3 priorities.",
        });
        created += 1;
      }
    }

    if (prefs.nightlyReview.enabled && timeMatches(hour, minute, prefs.nightlyReview.time)) {
      if (!(await NotificationService.existsToday(userId, "nightly_review", today))) {
        await NotificationService.create({
          userId,
          type: "nightly_review",
          title: "Time to reflect",
          body: "How did today go? Log your journal before you wrap up.",
        });
        created += 1;
      }
    }

    if (prefs.habitReminders) {
      const habits = await Habit.find({ userId: user._id, isActive: true, reminderTime: { $ne: null } });
      for (const habit of habits) {
        if (!habit.reminderTime || !timeMatches(hour, minute, habit.reminderTime)) continue;
        const pauseRanges = await getPauseRangesForHabit(userId, habit);
        const isPausedToday = pauseRanges.some((r) => today >= r.start && today <= r.end);
        if (isPausedToday) continue;
        if (await NotificationService.existsToday(userId, "habit_reminder", today, { habitId: habit._id.toString() })) continue;

        await NotificationService.create({
          userId,
          type: "habit_reminder",
          title: `Reminder: ${habit.name}`,
          body: `It's time for "${habit.name}".`,
          data: { habitId: habit._id.toString() },
        });
        created += 1;
      }
    }

    if (prefs.taskReminders) {
      const dueTasks = await Task.find({ userId: user._id, dueDate: today, status: { $in: ["todo", "in_progress"] } });
      if (dueTasks.length && hour === 9 && minute < 15) {
        if (!(await NotificationService.existsToday(userId, "task_reminder", today))) {
          await NotificationService.create({
            userId,
            type: "task_reminder",
            title: "Tasks due today",
            body: `You have ${dueTasks.length} task${dueTasks.length > 1 ? "s" : ""} due today.`,
          });
          created += 1;
        }
      }
    }

    if (prefs.streakRisk && hour === 20 && minute < 15) {
      const statuses = await getUserHabitStatusesForDate(userId, today, user.timezone);
      const atRisk = statuses.filter((s) => s.status === "pending");
      for (const s of atRisk) {
        const pauseRanges = await getPauseRangesForHabit(userId, s.habit);
        const checkIns = await HabitCheckIn.find({ habitId: s.habit._id }).lean();
        const streak = computeHabitStreak(s.habit, today, pauseRanges, checkIns);
        if (streak.current >= 3) {
          if (await NotificationService.existsToday(userId, "streak_risk", today, { habitId: s.habit._id.toString() })) continue;
          await NotificationService.create({
            userId,
            type: "streak_risk",
            title: `Don't break your streak`,
            body: `You're on a ${streak.current}-day streak for "${s.habit.name}". Complete it before the day ends.`,
            data: { habitId: s.habit._id.toString() },
          });
          created += 1;
        }
      }
    }

    if (prefs.goalReminders) {
      const goals = await Goal.find({ userId: user._id, status: "active", deadline: { $ne: null } });
      for (const goal of goals) {
        if (!goal.deadline) continue;
        const daysLeft = diffInDays(today, goal.deadline);
        if (daysLeft === 7 || daysLeft === 1) {
          if (hour !== 10 || minute >= 15) continue;
          if (await NotificationService.existsToday(userId, "goal_reminder", today, { goalId: goal._id.toString() })) continue;
          await NotificationService.create({
            userId,
            type: "goal_reminder",
            title: `${daysLeft} day${daysLeft > 1 ? "s" : ""} left: ${goal.title}`,
            body: `You're at ${goal.currentValue}/${goal.targetValue} ${goal.unit}.`,
            data: { goalId: goal._id.toString() },
          });
          created += 1;
        }
      }
    }
  }

  return created;
}
