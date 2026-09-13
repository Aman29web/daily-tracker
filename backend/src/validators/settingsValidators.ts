import { z } from "zod";

export const updateSettingsSchema = z.object({
  body: z.object({
    theme: z.enum(["light", "dark", "system"]).optional(),
    weekStartsOn: z.number().int().min(0).max(6).optional(),
    productivityWeights: z
      .object({
        habits: z.number().min(0).max(100),
        tasks: z.number().min(0).max(100),
        focus: z.number().min(0).max(100),
        top3: z.number().min(0).max(100),
      })
      .optional(),
    notificationPreferences: z
      .object({
        morningReminder: z.object({ enabled: z.boolean(), time: z.string() }).optional(),
        habitReminders: z.boolean().optional(),
        taskReminders: z.boolean().optional(),
        nightlyReview: z.object({ enabled: z.boolean(), time: z.string() }).optional(),
        streakRisk: z.boolean().optional(),
        goalReminders: z.boolean().optional(),
        weeklyReport: z.boolean().optional(),
        achievementAlerts: z.boolean().optional(),
        pushEnabled: z.boolean().optional(),
        emailEnabled: z.boolean().optional(),
      })
      .partial()
      .optional(),
    aiEnabled: z.boolean().optional(),
  }),
});
