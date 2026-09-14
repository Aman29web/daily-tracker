import { apiClient } from "@/api/client";
import { Plan, PlanPause } from "@/types";

export const plansApi = {
  list: (params?: { isArchived?: boolean; isTemplate?: boolean }) =>
    apiClient.get<{ data: Plan[] }>("/plans", { params }).then((r) => r.data.data),

  create: (input: { name: string; description?: string; category?: string; icon?: string; color?: string; isTemplate?: boolean }) =>
    apiClient.post<{ data: Plan }>("/plans", input).then((r) => r.data.data),

  update: (id: string, input: Partial<Plan>) => apiClient.patch<{ data: Plan }>(`/plans/${id}`, input).then((r) => r.data.data),

  activate: (id: string) => apiClient.post<{ data: Plan }>(`/plans/${id}/activate`).then((r) => r.data.data),
  deactivate: (id: string) => apiClient.post<{ data: Plan }>(`/plans/${id}/deactivate`).then((r) => r.data.data),
  archive: (id: string) => apiClient.post<{ data: Plan }>(`/plans/${id}/archive`).then((r) => r.data.data),
  unarchive: (id: string) => apiClient.post<{ data: Plan }>(`/plans/${id}/unarchive`).then((r) => r.data.data),
  duplicate: (id: string) => apiClient.post<{ data: Plan }>(`/plans/${id}/duplicate`).then((r) => r.data.data),
  useTemplate: (id: string) => apiClient.post<{ data: Plan }>(`/plans/${id}/use-template`).then((r) => r.data.data),
};

export const pausesApi = {
  list: () => apiClient.get<{ data: PlanPause[] }>("/pauses").then((r) => r.data.data),
  create: (input: { planId?: string; habitId?: string; startDate: string; endDate: string; reason?: string }) =>
    apiClient.post<{ data: PlanPause }>("/pauses", input).then((r) => r.data.data),
  remove: (id: string) => apiClient.delete(`/pauses/${id}`),
  endNow: (id: string) => apiClient.post<{ data: PlanPause }>(`/pauses/${id}/end-now`).then((r) => r.data.data),
};
