export const HABIT_TYPES = ["boolean", "numeric"] as const;
export type HabitType = (typeof HABIT_TYPES)[number];

export const SCHEDULE_TYPES = [
  "daily",
  "weekdays", // specific days of week (Mon-Fri or any custom subset)
  "x_per_week",
  "x_per_month",
  "specific_dates",
] as const;
export type ScheduleType = (typeof SCHEDULE_TYPES)[number];

/** Status of a single habit occurrence on a single calendar day. */
export const DAY_STATUSES = [
  "completed",
  "missed",
  "skipped",
  "paused",
  "rest_day",
  "not_scheduled",
  "pending",
  "upcoming",
  "inactive",
] as const;
export type DayStatus = (typeof DAY_STATUSES)[number];

export const TASK_STATUSES = ["todo", "in_progress", "completed", "cancelled"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_PRIORITIES = ["low", "medium", "high", "urgent"] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export const GOAL_STATUSES = ["active", "completed", "abandoned"] as const;
export type GoalStatus = (typeof GOAL_STATUSES)[number];

export const GOAL_PROGRESS_SOURCES = ["manual", "focus_sessions", "habit_checkins", "tasks"] as const;
export type GoalProgressSource = (typeof GOAL_PROGRESS_SOURCES)[number];

export const FOCUS_MODES = ["25", "50", "custom"] as const;
export type FocusMode = (typeof FOCUS_MODES)[number];

export const FOCUS_STATUSES = ["running", "paused", "completed", "cancelled"] as const;
export type FocusStatus = (typeof FOCUS_STATUSES)[number];

export const MOODS = ["great", "good", "okay", "bad", "terrible"] as const;
export type Mood = (typeof MOODS)[number];

export const MOOD_SCORES: Record<Mood, number> = {
  great: 5,
  good: 4,
  okay: 3,
  bad: 2,
  terrible: 1,
};

export const NOTIFICATION_TYPES = [
  "morning_reminder",
  "habit_reminder",
  "task_reminder",
  "nightly_review",
  "streak_risk",
  "goal_reminder",
  "achievement_unlocked",
  "weekly_report",
  "system",
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const NOTIFICATION_CHANNELS = ["in_app", "push", "email"] as const;
export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number];

export const NOTIFICATION_STATUSES = ["pending", "sent", "read", "failed", "cancelled"] as const;
export type NotificationStatus = (typeof NOTIFICATION_STATUSES)[number];
