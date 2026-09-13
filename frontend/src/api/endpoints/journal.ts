import { apiClient } from "../client";
import { JournalEntry, Mood, MoodEntry } from "../../types";

export interface JournalInput {
  date: string;
  wentWell?: string;
  wentWrong?: string;
  learned?: string;
  improveTomorrow?: string;
  content?: string;
  mood?: Mood;
  energy?: number;
  tags?: string[];
}

export const journalApi = {
  list: (params?: { start?: string; end?: string; mood?: string; tag?: string; search?: string }) =>
    apiClient.get<{ data: JournalEntry[] }>("/journal", { params }).then((r) => r.data.data),

  getByDate: (date: string) => apiClient.get<{ data: JournalEntry | null }>(`/journal/date/${date}`).then((r) => r.data.data),

  upsert: (input: JournalInput) => apiClient.post<{ data: JournalEntry }>("/journal", input).then((r) => r.data.data),

  update: (id: string, input: Partial<JournalInput>) =>
    apiClient.patch<{ data: JournalEntry }>(`/journal/${id}`, input).then((r) => r.data.data),

  remove: (id: string) => apiClient.delete(`/journal/${id}`),
};

export const moodApi = {
  list: (start?: string, end?: string) =>
    apiClient.get<{ data: MoodEntry[] }>("/mood", { params: { start, end } }).then((r) => r.data.data),

  upsert: (date: string, mood: Mood, energy: number) =>
    apiClient.post<{ data: MoodEntry }>("/mood", { date, mood, energy }).then((r) => r.data.data),
};
