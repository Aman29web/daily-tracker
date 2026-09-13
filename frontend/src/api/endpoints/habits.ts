import { apiClient } from "../client";
import { DayStatusResult, Habit, HabitSchedule, HabitWithStats, StreakResult } from "../../types";

export interface CreateHabitInput {
  name: string;
  description?: string;
  icon: string;
  color: string;
  category: string;
  type: "boolean" | "numeric";
  target?: { value: number; unit: string };
  priority: "low" | "medium" | "high";
  reminderTime?: string;
  startDate: string;
  endDate?: string | null;
  planId?: string | null;
  schedule: HabitSchedule;
}

export const habitsApi = {
  /** Each item carries the habit plus its real today-status and streak, computed server-side. */
  list: (params?: { category?: string; planId?: string; isActive?: boolean; search?: string }) =>
    apiClient.get<{ data: HabitWithStats[] }>("/habits", { params }).then((r) => r.data.data),

  get: (id: string) => apiClient.get<{ data: HabitWithStats }>(`/habits/${id}`).then((r) => r.data.data),

  create: (input: CreateHabitInput) => apiClient.post<{ data: Habit }>("/habits", input).then((r) => r.data.data),

  update: (id: string, input: Partial<CreateHabitInput> & { isActive?: boolean }) =>
    apiClient.patch<{ data: Habit }>(`/habits/${id}`, input).then((r) => r.data.data),

  updateSchedule: (id: string, schedule: HabitSchedule, effectiveFrom?: string) =>
    apiClient.put<{ data: Habit }>(`/habits/${id}/schedule`, { schedule, effectiveFrom }).then((r) => r.data.data),

  remove: (id: string) => apiClient.delete(`/habits/${id}`),

  checkIn: (
    id: string,
    input: { date: string; action: "complete" | "undo" | "skip" | "miss" | "increment" | "set_value"; value?: number; note?: string }
  ) =>
    apiClient
      .post<{ data: { habit: Habit; day: DayStatusResult; streak: StreakResult } }>(`/habits/${id}/check-in`, input)
      .then((r) => r.data.data),

  range: (id: string, start: string, end: string) =>
    apiClient
      .get<{ data: ({ date: string } & DayStatusResult)[] }>(`/habits/${id}/range`, { params: { start, end } })
      .then((r) => r.data.data),

  stats: (id: string) =>
    apiClient.get<{ data: { streak: StreakResult; today: DayStatusResult } }>(`/habits/${id}/stats`).then((r) => r.data.data),
};
