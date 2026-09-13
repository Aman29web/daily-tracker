import cron from "node-cron";
import { logger } from "../config/logger";
import { finalizeYesterdayForAllUsers } from "../services/dailySummaryService";
import { generateScheduledNotifications } from "../services/notificationGenerationService";
import { NotificationService } from "../notifications/NotificationService";
import { evaluateAchievementsForAllUsers } from "../services/achievementService";

/**
 * All scheduled work lives here so it runs identically regardless of which
 * client (web today, React Native later) triggered the underlying data
 * change - nothing here is web-specific.
 */
export function startJobs(): void {
  // Every 15 minutes: enqueue reminders whose local time has arrived for each user's timezone.
  cron.schedule("*/15 * * * *", async () => {
    try {
      const created = await generateScheduledNotifications();
      if (created) logger.info(`Notification generation created ${created} notification(s)`);
    } catch (err) {
      logger.error("generateScheduledNotifications failed", { err });
    }
  });

  // Every minute: deliver anything due (in-app rows just flip to "sent"; push/email attempt their provider).
  cron.schedule("* * * * *", async () => {
    try {
      await NotificationService.dispatchDue();
    } catch (err) {
      logger.error("NotificationService.dispatchDue failed", { err });
    }
  });

  // Once an hour: finalize "yesterday" for any user whose local midnight has just passed.
  cron.schedule("5 * * * *", async () => {
    try {
      const count = await finalizeYesterdayForAllUsers();
      if (count) logger.info(`Finalized daily summaries for ${count} user(s)`);
    } catch (err) {
      logger.error("finalizeYesterdayForAllUsers failed", { err });
    }
  });

  // Twice a day: sweep for newly-earned achievements (also evaluated inline after key actions).
  cron.schedule("10 */12 * * *", async () => {
    try {
      const count = await evaluateAchievementsForAllUsers();
      if (count) logger.info(`Unlocked ${count} achievement(s) across all users`);
    } catch (err) {
      logger.error("evaluateAchievementsForAllUsers failed", { err });
    }
  });

  logger.info("Background jobs scheduled");
}
