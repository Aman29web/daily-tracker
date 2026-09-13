import { Types } from "mongoose";
import { Achievement, IAchievement } from "../models/Achievement";
import { UserAchievement, IUserAchievement } from "../models/UserAchievement";
import { Habit } from "../models/Habit";
import { HabitCheckIn } from "../models/HabitCheckIn";
import { FocusSession } from "../models/FocusSession";
import { JournalEntry } from "../models/JournalEntry";
import { Task } from "../models/Task";
import { Goal } from "../models/Goal";
import { Plan } from "../models/Plan";
import { DailySummary } from "../models/DailySummary";
import { computeHabitStreak } from "./streakService";
import { getPauseRangesForHabit } from "./pauseService";
import { ACHIEVEMENT_CATALOG } from "./achievementCatalog";
import { timeInTimezone, todayInTimezone } from "../utils/dateUtils";
import { NotificationService } from "../notifications/NotificationService";
import { User } from "../models/User";

export async function ensureAchievementCatalog(): Promise<void> {
  await Promise.all(
    ACHIEVEMENT_CATALOG.map((def) =>
      Achievement.findOneAndUpdate({ key: def.key }, { $set: def }, { upsert: true })
    )
  );
}

async function computeProgress(userId: string, timezone: string, achievement: IAchievement): Promise<number> {
  const { type, threshold, category } = achievement.criteria;
  const userObjectId = new Types.ObjectId(userId);

  switch (type) {
    case "total_checkins":
      return HabitCheckIn.countDocuments({ userId: userObjectId, status: "completed" });

    case "total_checkins_category": {
      const habitIds = await Habit.find({ userId: userObjectId, category }).distinct("_id");
      return HabitCheckIn.countDocuments({ userId: userObjectId, habitId: { $in: habitIds }, status: "completed" });
    }

    case "streak_days": {
      const habits = await Habit.find({ userId: userObjectId });
      const today = todayInTimezone(timezone);
      let best = 0;
      for (const habit of habits) {
        const pauseRanges = await getPauseRangesForHabit(userId, habit);
        const checkIns = await HabitCheckIn.find({ habitId: habit._id }).lean();
        const streak = computeHabitStreak(habit, today, pauseRanges, checkIns);
        best = Math.max(best, streak.longest);
        if (best >= threshold) break;
      }
      return best;
    }

    case "total_focus_minutes": {
      const result = await FocusSession.aggregate([
        { $match: { userId: userObjectId, status: "completed" } },
        { $group: { _id: null, minutes: { $sum: "$actualDuration" } } },
      ]);
      return Math.round(result[0]?.minutes ?? 0);
    }

    case "early_morning_checkins": {
      const checkIns = await HabitCheckIn.find({ userId: userObjectId, status: "completed", completedAt: { $ne: null } }).lean();
      return checkIns.filter((c) => c.completedAt && timeInTimezone(c.completedAt, timezone).hour < 7).length;
    }

    case "journal_entries":
      return JournalEntry.countDocuments({ userId: userObjectId });

    case "tasks_completed":
      return Task.countDocuments({ userId: userObjectId, status: "completed" });

    case "goals_completed":
      return Goal.countDocuments({ userId: userObjectId, status: "completed" });

    case "plan_created":
      return Plan.countDocuments({ userId: userObjectId });

    case "perfect_week": {
      const summaries = await DailySummary.find({ userId: userObjectId, isFinal: true }).sort({ date: -1 }).limit(30);
      let streak = 0;
      let best = 0;
      let prevDate: string | null = null;
      for (const s of summaries.slice().reverse()) {
        const consecutive = !prevDate || isNextDay(prevDate, s.date);
        if (consecutive && s.productivityScore >= 90) {
          streak += 1;
        } else {
          streak = s.productivityScore >= 90 ? 1 : 0;
        }
        best = Math.max(best, streak);
        prevDate = s.date;
      }
      return best;
    }

    default:
      return 0;
  }
}

function isNextDay(prev: string, current: string): boolean {
  const p = new Date(`${prev}T00:00:00Z`);
  p.setUTCDate(p.getUTCDate() + 1);
  return p.toISOString().slice(0, 10) === current;
}

export interface AchievementProgress {
  achievement: IAchievement;
  unlocked: boolean;
  unlockedAt: Date | null;
  progress: number;
  threshold: number;
}

export async function getAchievementsForUser(userId: string, timezone: string): Promise<AchievementProgress[]> {
  const [catalog, unlocked] = await Promise.all([
    Achievement.find().sort({ createdAt: 1 }),
    UserAchievement.find({ userId }),
  ]);
  const unlockedMap = new Map(unlocked.map((u) => [u.achievementKey, u]));

  return Promise.all(
    catalog.map(async (achievement) => {
      const existing = unlockedMap.get(achievement.key);
      const progress = existing ? achievement.criteria.threshold : await computeProgress(userId, timezone, achievement);
      return {
        achievement,
        unlocked: !!existing,
        unlockedAt: existing?.unlockedAt ?? null,
        progress: Math.min(progress, achievement.criteria.threshold),
        threshold: achievement.criteria.threshold,
      };
    })
  );
}

/**
 * Evaluates every not-yet-unlocked achievement for a user and unlocks any
 * that now meet their threshold, firing an in-app notification for each.
 * Called after actions likely to cross a threshold (check-in, focus
 * complete, task complete, journal save) rather than on every read.
 */
export async function evaluateAchievementsForUser(userId: string, timezone: string): Promise<IUserAchievement[]> {
  const [catalog, unlockedKeys] = await Promise.all([
    Achievement.find(),
    UserAchievement.find({ userId }).distinct("achievementKey"),
  ]);
  const unlockedSet = new Set(unlockedKeys);
  const newlyUnlocked: IUserAchievement[] = [];

  for (const achievement of catalog) {
    if (unlockedSet.has(achievement.key)) continue;
    const progress = await computeProgress(userId, timezone, achievement);
    if (progress >= achievement.criteria.threshold) {
      const unlocked = await UserAchievement.create({
        userId,
        achievementKey: achievement.key,
        progress: achievement.criteria.threshold,
      });
      newlyUnlocked.push(unlocked);
      await NotificationService.create({
        userId,
        type: "achievement_unlocked",
        title: "Achievement unlocked",
        body: `${achievement.title}: ${achievement.description}`,
        data: { achievementKey: achievement.key },
      });
    }
  }
  return newlyUnlocked;
}

export async function evaluateAchievementsForAllUsers(): Promise<number> {
  const users = await User.find().select("timezone");
  let total = 0;
  for (const user of users) {
    const unlocked = await evaluateAchievementsForUser(user._id.toString(), user.timezone);
    total += unlocked.length;
  }
  return total;
}
