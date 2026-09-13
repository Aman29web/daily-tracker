import { apiClient } from "../client";
import { FocusSession } from "../../types";

export const focusApi = {
  list: (params?: { start?: string; end?: string; status?: string; limit?: number }) =>
    apiClient.get<{ data: FocusSession[] }>("/focus/sessions", { params }).then((r) => r.data.data),

  start: (input: { mode: "25" | "50" | "custom"; plannedDuration: number; taskId?: string | null; goalId?: string | null; category?: string }) =>
    apiClient.post<{ data: FocusSession }>("/focus/sessions", input).then((r) => r.data.data),

  pause: (id: string) => apiClient.patch<{ data: FocusSession }>(`/focus/sessions/${id}/pause`).then((r) => r.data.data),
  resume: (id: string) => apiClient.patch<{ data: FocusSession }>(`/focus/sessions/${id}/resume`).then((r) => r.data.data),
  complete: (id: string) => apiClient.patch<{ data: FocusSession }>(`/focus/sessions/${id}/complete`).then((r) => r.data.data),
  cancel: (id: string) => apiClient.patch<{ data: FocusSession }>(`/focus/sessions/${id}/cancel`).then((r) => r.data.data),
};
