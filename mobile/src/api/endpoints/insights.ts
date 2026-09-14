import { apiClient } from "@/api/client";
import {
  Achievement,
  AchievementProgress,
  AppNotification,
  CalendarDay,
  CalendarDayDetail,
  DashboardData,
  Insight,
  MonthlyReport,
  ProductivityProfile,
  UserSettings,
  WeeklyReport,
} from "@/types";

export const dashboardApi = {
  get: () => apiClient.get<{ data: DashboardData }>("/dashboard").then((r) => r.data.data),
};

export const calendarApi = {
  range: (start: string, end: string) =>
    apiClient.get<{ data: CalendarDay[] }>("/calendar", { params: { start, end } }).then((r) => r.data.data),
  day: (date: string) => apiClient.get<{ data: CalendarDayDetail }>(`/calendar/day/${date}`).then((r) => r.data.data),
};

export const analyticsApi = {
  daily: (date: string) => apiClient.get(`/analytics/daily`, { params: { date } }).then((r) => r.data.data),
  weekly: (date?: string) => apiClient.get<{ data: WeeklyReport }>(`/analytics/weekly`, { params: { date } }).then((r) => r.data.data),
  monthly: (month?: string) =>
    apiClient.get<{ data: MonthlyReport }>(`/analytics/monthly`, { params: { month } }).then((r) => r.data.data),
  insights: () => apiClient.get<{ data: Insight[] }>("/analytics/insights").then((r) => r.data.data),
  profile: () => apiClient.get<{ data: ProductivityProfile }>("/analytics/profile").then((r) => r.data.data),
};

export const achievementsApi = {
  list: () => apiClient.get<{ data: AchievementProgress[] }>("/achievements").then((r) => r.data.data),
};

export const notificationsApi = {
  list: (params?: { page?: number; limit?: number; unreadOnly?: boolean }) =>
    apiClient
      .get<{ data: AppNotification[]; meta: { unreadCount: number } }>("/notifications", { params })
      .then((r) => ({ items: r.data.data, unreadCount: r.data.meta.unreadCount })),
  markRead: (id: string) => apiClient.patch(`/notifications/${id}/read`),
  markAllRead: () => apiClient.patch("/notifications/read-all"),
  remove: (id: string) => apiClient.delete(`/notifications/${id}`),
};

export const settingsApi = {
  get: () => apiClient.get<{ data: UserSettings }>("/settings").then((r) => r.data.data),
  update: (input: Partial<UserSettings>) => apiClient.patch<{ data: UserSettings }>("/settings", input).then((r) => r.data.data),
};

export const searchApi = {
  search: (q: string) =>
    apiClient
      .get<{ data: { habits: unknown[]; tasks: unknown[]; goals: unknown[]; journal: unknown[] } }>("/search", { params: { q } })
      .then((r) => r.data.data),
};

export const aiApi = {
  dailyAnalysis: (date?: string) => apiClient.get<{ data: { analysis: string } }>("/ai/daily-analysis", { params: { date } }).then((r) => r.data.data.analysis),
  weeklyReview: () => apiClient.get<{ data: { review: string } }>("/ai/weekly-review").then((r) => r.data.data.review),
  habitRecommendations: () =>
    apiClient.get<{ data: { recommendations: string[] } }>("/ai/habit-recommendations").then((r) => r.data.data.recommendations),
  goalRecommendations: () =>
    apiClient.get<{ data: { recommendations: string[] } }>("/ai/goal-recommendations").then((r) => r.data.data.recommendations),
  ask: (question: string) => apiClient.post<{ data: { answer: string } }>("/ai/ask", { question }).then((r) => r.data.data.answer),
};

export type { Achievement };
