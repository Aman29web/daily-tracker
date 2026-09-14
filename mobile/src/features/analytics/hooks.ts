import { useMutation, useQuery } from "@tanstack/react-query";
import { aiApi, analyticsApi } from "@/api/endpoints/insights";

export function useWeeklyReport() {
  return useQuery({ queryKey: ["analytics-weekly"], queryFn: () => analyticsApi.weekly() });
}

export function useMonthlyReport(month?: string) {
  return useQuery({ queryKey: ["analytics-monthly", month], queryFn: () => analyticsApi.monthly(month) });
}

export function useInsights() {
  return useQuery({ queryKey: ["analytics-insights"], queryFn: analyticsApi.insights });
}

export function useProductivityProfile() {
  return useQuery({ queryKey: ["analytics-profile"], queryFn: analyticsApi.profile });
}

/** AI calls can take several seconds and occasionally fail over - staleTime keeps a re-visit from re-triggering the wait. */
export function useAiWeeklyReview() {
  return useQuery({ queryKey: ["ai-weekly-review"], queryFn: aiApi.weeklyReview, staleTime: 10 * 60_000, retry: false });
}

export function useAiHabitRecommendations() {
  return useQuery({
    queryKey: ["ai-habit-recommendations"],
    queryFn: aiApi.habitRecommendations,
    staleTime: 10 * 60_000,
    retry: false,
  });
}

export function useAiGoalRecommendations() {
  return useQuery({
    queryKey: ["ai-goal-recommendations"],
    queryFn: aiApi.goalRecommendations,
    staleTime: 10 * 60_000,
    retry: false,
  });
}

export function useAskAi() {
  return useMutation({ mutationFn: (question: string) => aiApi.ask(question) });
}
