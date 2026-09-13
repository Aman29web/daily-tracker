import { MoodEntry, IMoodEntry } from "../models/MoodEntry";

export async function upsertMoodEntry(userId: string, date: string, mood: string, energy: number): Promise<IMoodEntry> {
  return MoodEntry.findOneAndUpdate(
    { userId, date },
    { $set: { userId, date, mood, energy } },
    { upsert: true, new: true, runValidators: true }
  ) as Promise<IMoodEntry>;
}

export async function listMoodEntries(userId: string, start?: string, end?: string): Promise<IMoodEntry[]> {
  const query: Record<string, unknown> = { userId };
  if (start || end) {
    query.date = { ...(start ? { $gte: start } : {}), ...(end ? { $lte: end } : {}) };
  }
  return MoodEntry.find(query).sort({ date: 1 });
}

export async function getMoodByDate(userId: string, date: string): Promise<IMoodEntry | null> {
  return MoodEntry.findOne({ userId, date });
}
