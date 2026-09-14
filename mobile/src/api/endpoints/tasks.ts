import { apiClient } from "@/api/client";
import { Task, TaskPriority, TaskStatus } from "@/types";

export interface TaskFilters {
  status?: TaskStatus;
  priority?: TaskPriority;
  category?: string;
  goalId?: string;
  search?: string;
  dueBefore?: string;
  dueAfter?: string;
  page?: number;
  limit?: number;
}

export const tasksApi = {
  list: (filters?: TaskFilters) => apiClient.get<{ data: Task[] }>("/tasks", { params: filters }).then((r) => r.data.data),

  create: (input: Partial<Task> & { title: string }) => apiClient.post<{ data: Task }>("/tasks", input).then((r) => r.data.data),

  update: (id: string, input: Partial<Task>) => apiClient.patch<{ data: Task }>(`/tasks/${id}`, input).then((r) => r.data.data),

  remove: (id: string) => apiClient.delete(`/tasks/${id}`),

  reorder: (orderedIds: string[]) => apiClient.patch("/tasks/reorder", { orderedIds }),

  getTop3: (date: string) => apiClient.get<{ data: Task[] }>("/tasks/top3", { params: { date } }).then((r) => r.data.data),

  setTop3: (date: string, taskIds: string[]) =>
    apiClient.post<{ data: Task[] }>("/tasks/top3", { date, taskIds }).then((r) => r.data.data),
};
