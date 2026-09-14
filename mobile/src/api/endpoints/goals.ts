import { apiClient } from "@/api/client";
import { Goal } from "@/types";

export const goalsApi = {
  list: (params?: { status?: string; category?: string }) =>
    apiClient.get<{ data: Goal[] }>("/goals", { params }).then((r) => r.data.data),

  get: (id: string) => apiClient.get<{ data: Goal }>(`/goals/${id}`).then((r) => r.data.data),

  create: (input: {
    title: string;
    description?: string;
    category?: string;
    targetValue: number;
    unit?: string;
    progressSource?: string;
    linkedHabitIds?: string[];
    deadline?: string | null;
  }) => apiClient.post<{ data: Goal }>("/goals", input).then((r) => r.data.data),

  update: (id: string, input: Partial<Goal>) => apiClient.patch<{ data: Goal }>(`/goals/${id}`, input).then((r) => r.data.data),

  setProgress: (id: string, currentValue: number) =>
    apiClient.patch<{ data: Goal }>(`/goals/${id}/progress`, { currentValue }).then((r) => r.data.data),

  remove: (id: string) => apiClient.delete(`/goals/${id}`),
};
