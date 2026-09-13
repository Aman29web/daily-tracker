export type HabitType = "boolean" | "numeric";
export type ScheduleType = "daily" | "weekdays" | "x_per_week" | "x_per_month" | "specific_dates";
export type DayStatus =
  | "completed"
  | "missed"
  | "skipped"
  | "paused"
  | "rest_day"
  | "not_scheduled"
  | "pending"
  | "upcoming"
  | "inactive";
export type Priority = "low" | "medium" | "high";
export type TaskStatus = "todo" | "in_progress" | "completed" | "cancelled";
export type TaskPriority = "low" | "medium" | "high" | "urgent";
export type GoalStatus = "active" | "completed" | "abandoned";
export type GoalProgressSource = "manual" | "focus_sessions" | "habit_checkins" | "tasks";
export type FocusMode = "25" | "50" | "custom";
export type FocusStatus = "running" | "paused" | "completed" | "cancelled";
export type Mood = "great" | "good" | "okay" | "bad" | "terrible";

export interface HabitSchedule {
  type: ScheduleType;
  daysOfWeek: number[];
  timesPerPeriod?: number;
  specificDates: string[];
}

export interface HabitTarget {
  value: number;
  unit: string;
}

export interface Habit {
  _id: string;
  userId: string;
  name: string;
  description?: string;
  icon: string;
  color: string;
  category: string;
  type: HabitType;
  target?: HabitTarget;
  priority: Priority;
  reminderTime?: string;
  startDate: string;
  endDate?: string | null;
  isActive: boolean;
  planId?: string | null;
  scheduleHistory: { schedule: HabitSchedule; effectiveFrom: string; effectiveTo: string | null }[];
  createdAt: string;
  updatedAt: string;
}

export interface DayStatusResult {
  status: DayStatus;
  scheduled: boolean;
  value?: number;
  targetValue?: number;
  note?: string;
}

export interface StreakResult {
  current: number;
  longest: number;
  lastCompletedDate: string | null;
}

export interface HabitWithStats {
  habit: Habit;
  today: DayStatusResult;
  streak: StreakResult;
}

export interface Plan {
  _id: string;
  userId: string;
  name: string;
  description?: string;
  category: string;
  icon: string;
  color: string;
  isActive: boolean;
  isArchived: boolean;
  isTemplate: boolean;
  habitCount?: number;
  createdAt: string;
}

export interface PlanPause {
  _id: string;
  planId?: string | null;
  habitId?: string | null;
  startDate: string;
  endDate: string;
  reason?: string;
  isActive?: boolean;
  isUpcoming?: boolean;
}

export interface Task {
  _id: string;
  userId: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  dueDate?: string | null;
  status: TaskStatus;
  category: string;
  estimatedDuration?: number;
  actualDuration?: number;
  goalId?: string | null;
  planId?: string | null;
  isTop3: boolean;
  top3Date?: string | null;
  order: number;
  completedAt?: string | null;
  createdAt: string;
}

export interface GoalPace {
  progressPercent: number;
  daysElapsed: number;
  daysRemaining: number | null;
  requiredPacePerDay: number | null;
  currentPacePerDay: number;
  predictedCompletionDate: string | null;
  onTrack: boolean | null;
}

export interface Goal {
  _id: string;
  userId: string;
  title: string;
  description?: string;
  category: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  progressSource: GoalProgressSource;
  linkedHabitIds: string[];
  deadline?: string | null;
  status: GoalStatus;
  createdAt: string;
  completedAt?: string | null;
  pace?: GoalPace;
}

export interface JournalEntry {
  _id: string;
  userId: string;
  date: string;
  wentWell?: string;
  wentWrong?: string;
  learned?: string;
  improveTomorrow?: string;
  content?: string;
  mood?: Mood;
  energy?: number;
  tags: string[];
  createdAt: string;
}

export interface MoodEntry {
  _id: string;
  date: string;
  mood: Mood;
  energy: number;
}

export interface FocusSession {
  _id: string;
  userId: string;
  mode: FocusMode;
  plannedDuration: number;
  actualDuration: number;
  startTime: string;
  endTime?: string | null;
  lastResumedAt?: string | null;
  status: FocusStatus;
  taskId?: string | null;
  goalId?: string | null;
  category: string;
  date: string;
}

export interface DailySummary {
  _id?: string;
  date: string;
  productivityScore: number;
  habitsScheduled: number;
  habitsCompleted: number;
  habitsMissed: number;
  habitsSkipped: number;
  habitsPaused: number;
  habitsRestDay: number;
  tasksTotal: number;
  tasksCompleted: number;
  focusMinutes: number;
  focusSessions: number;
  mood?: string | null;
  energy?: number | null;
  journalCompleted: boolean;
  top3Total: number;
  top3Completed: number;
  isFinal: boolean;
}

export interface ProductivityBreakdown {
  score: number;
  habits: { score: number; completed: number; missed: number; scheduled: number };
  tasks: { score: number; completed: number; total: number };
  focus: { score: number; minutes: number; goalMinutes: number };
  top3: { score: number; completed: number; total: number };
}

export interface DashboardData {
  date: string;
  hero: { message: string; tone: string };
  productivity: ProductivityBreakdown;
  habits: {
    habit: { id: string; name: string; icon: string; color: string; type: HabitType; priority: Priority; category: string };
    status: DayStatus;
    value?: number;
    targetValue?: number;
    streak: number;
  }[];
  top3: Task[];
  goals: Goal[];
  focusMinutes: number;
  mood: { mood: string; energy: number } | null;
  journalCompleted: boolean;
  streaks: { longestActive: number };
  totalActiveHabits: number;
}

export interface Achievement {
  _id: string;
  key: string;
  title: string;
  description: string;
  icon: string;
  criteria: { type: string; threshold: number; category?: string };
}

export interface AchievementProgress {
  achievement: Achievement;
  unlocked: boolean;
  unlockedAt: string | null;
  progress: number;
  threshold: number;
}

export interface AppNotification {
  _id: string;
  type: string;
  channel: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  status: string;
  scheduledFor: string;
  readAt: string | null;
  createdAt: string;
}

export interface UserSettings {
  _id: string;
  userId: string;
  theme: "light" | "dark" | "system";
  weekStartsOn: number;
  productivityWeights: { habits: number; tasks: number; focus: number; top3: number };
  notificationPreferences: {
    morningReminder: { enabled: boolean; time: string };
    habitReminders: boolean;
    taskReminders: boolean;
    nightlyReview: { enabled: boolean; time: string };
    streakRisk: boolean;
    goalReminders: boolean;
    weeklyReport: boolean;
    achievementAlerts: boolean;
    pushEnabled: boolean;
    emailEnabled: boolean;
  };
  aiEnabled: boolean;
}

export interface WeeklyReport {
  start: string;
  end: string;
  productivityAvg: number;
  habitsCompletionAvg: number;
  focusMinutesTotal: number;
  journalDays: number;
  totalDays: number;
  topHabit: { name: string; completionRate: number } | null;
  mostMissedHabit: { name: string; missRate: number } | null;
  bestDay: { date: string; score: number } | null;
  worstDay: { date: string; score: number } | null;
  dailyScores: { date: string; score: number }[];
}

export interface MonthlyReport extends WeeklyReport {
  goalCompletionCount: number;
  moodAvg: number | null;
  energyAvg: number | null;
  streakBest: number;
}

export interface ProductivityProfile {
  bestProductivityTime: string | null;
  bestDayOfWeek: string | null;
  strongestHabit: string | null;
  weakestHabit: string | null;
  avgFocusMinutesPerDay: number;
  avgMood: number | null;
  avgEnergy: number | null;
  currentBestStreak: number;
  longestStreakEver: number;
  monthlyTrend: { month: string; avgScore: number }[];
}

export interface Insight {
  text: string;
  category: "mood" | "habit" | "time" | "sleep" | "general";
}

export interface CalendarDayDetail {
  date: string;
  summary: DailySummary;
  habits: { id: string; name: string; icon: string; color: string; status: DayStatus; value?: number; targetValue?: number }[];
  top3: { total: number; completed: number };
  tasks: Task[];
  journal: JournalEntry | null;
  mood: { mood: string; energy: number } | null;
}

export interface CalendarDay {
  date: string;
  productivityScore: number;
  habitsScheduled: number;
  habitsCompleted: number;
  habitsMissed: number;
  habitsPaused: number;
  focusMinutes: number;
  mood?: string | null;
  journalCompleted: boolean;
  /** false for dates after today — nothing has happened yet, so productivityScore is not meaningful. */
  hasData: boolean;
}
