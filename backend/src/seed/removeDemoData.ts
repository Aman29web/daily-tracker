/* eslint-disable no-console */
import { connectDB, disconnectDB } from "../config/db";
import { User } from "../models/User";
import { UserSettings } from "../models/UserSettings";
import { Habit } from "../models/Habit";
import { HabitCheckIn } from "../models/HabitCheckIn";
import { Plan } from "../models/Plan";
import { PlanPause } from "../models/PlanPause";
import { Task } from "../models/Task";
import { Goal } from "../models/Goal";
import { JournalEntry } from "../models/JournalEntry";
import { MoodEntry } from "../models/MoodEntry";
import { FocusSession } from "../models/FocusSession";
import { DailySummary } from "../models/DailySummary";
import { UserAchievement } from "../models/UserAchievement";
import { Notification } from "../models/Notification";

const DEMO_EMAIL = "demo@tracker.app";

async function removeDemoData() {
  await connectDB();

  const user = await User.findOne({ email: DEMO_EMAIL });
  if (!user) {
    console.log(`No user found with email ${DEMO_EMAIL} - nothing to remove.`);
    await disconnectDB();
    process.exit(0);
  }

  const userId = user._id;
  console.log(`Removing all data for ${DEMO_EMAIL} (${userId})...`);

  const results = await Promise.all([
    Habit.deleteMany({ userId }),
    HabitCheckIn.deleteMany({ userId }),
    Plan.deleteMany({ userId }),
    PlanPause.deleteMany({ userId }),
    Task.deleteMany({ userId }),
    Goal.deleteMany({ userId }),
    JournalEntry.deleteMany({ userId }),
    MoodEntry.deleteMany({ userId }),
    FocusSession.deleteMany({ userId }),
    DailySummary.deleteMany({ userId }),
    UserAchievement.deleteMany({ userId }),
    Notification.deleteMany({ userId }),
    UserSettings.deleteMany({ userId }),
  ]);

  const totalDeleted = results.reduce((sum, r) => sum + r.deletedCount, 0);
  await User.deleteOne({ _id: userId });

  console.log(`Removed ${totalDeleted} related document(s) plus the user account.`);
  console.log("Demo data removed.");

  await disconnectDB();
  process.exit(0);
}

removeDemoData().catch((err) => {
  console.error("Failed to remove demo data", err);
  process.exit(1);
});
