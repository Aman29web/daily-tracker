import { IAchievementCriteria } from "../models/Achievement";

export interface AchievementDefinition {
  key: string;
  title: string;
  description: string;
  icon: string;
  criteria: IAchievementCriteria;
}

/** Static catalog seeded into the Achievement collection (idempotent upsert on startup and in seed data). */
export const ACHIEVEMENT_CATALOG: AchievementDefinition[] = [
  {
    key: "first_week",
    title: "First Week",
    description: "Complete 7 habit check-ins",
    icon: "trophy",
    criteria: { type: "total_checkins", threshold: 7 },
  },
  {
    key: "streak_7",
    title: "7 Day Streak",
    description: "Reach a 7-day streak on any habit",
    icon: "flame",
    criteria: { type: "streak_days", threshold: 7 },
  },
  {
    key: "streak_30",
    title: "30 Day Streak",
    description: "Reach a 30-day streak on any habit",
    icon: "flame",
    criteria: { type: "streak_days", threshold: 30 },
  },
  {
    key: "reading_30",
    title: "Bookworm",
    description: "Complete 30 reading sessions",
    icon: "book-open",
    criteria: { type: "total_checkins_category", threshold: 30, category: "reading" },
  },
  {
    key: "gym_20",
    title: "Iron Discipline",
    description: "Complete 20 gym sessions",
    icon: "dumbbell",
    criteria: { type: "total_checkins_category", threshold: 20, category: "fitness" },
  },
  {
    key: "focus_50h",
    title: "Deep Work",
    description: "Accumulate 50 hours of focus time",
    icon: "brain",
    criteria: { type: "total_focus_minutes", threshold: 3000 },
  },
  {
    key: "early_mornings_10",
    title: "Early Riser",
    description: "Complete 10 habits before 7 AM",
    icon: "sunrise",
    criteria: { type: "early_morning_checkins", threshold: 10 },
  },
  {
    key: "journal_20",
    title: "Reflective Mind",
    description: "Write 20 journal entries",
    icon: "notebook",
    criteria: { type: "journal_entries", threshold: 20 },
  },
  {
    key: "tasks_50",
    title: "Task Master",
    description: "Complete 50 tasks",
    icon: "check-circle",
    criteria: { type: "tasks_completed", threshold: 50 },
  },
  {
    key: "goals_5",
    title: "Goal Getter",
    description: "Complete 5 goals",
    icon: "target",
    criteria: { type: "goals_completed", threshold: 5 },
  },
  {
    key: "first_plan",
    title: "Planner",
    description: "Create your first plan",
    icon: "layers",
    criteria: { type: "plan_created", threshold: 1 },
  },
  {
    key: "perfect_week",
    title: "Perfect Week",
    description: "Score 90+ productivity for 7 consecutive days",
    icon: "star",
    criteria: { type: "perfect_week", threshold: 7 },
  },
];
