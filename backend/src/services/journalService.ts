import { JournalEntry, IJournalEntry } from "../models/JournalEntry";
import { MoodEntry } from "../models/MoodEntry";
import { ApiError } from "../utils/ApiError";
import { evaluateAchievementsInBackground } from "./achievementService";
import { todayInTimezone } from "../utils/dateUtils";

/**
 * Journal and mood/energy are captured together in one form but persisted
 * separately: MoodEntry is the canonical source analytics reads from (see
 * services/analyticsService.ts's mood-vs-productivity correlation), while
 * JournalEntry also keeps its own mood/energy snapshot purely for display
 * convenience on the entry itself.
 *
 * A user gets exactly one entry per calendar day (enforced by the unique
 * index on userId+date) and can only write or edit it on the day it
 * belongs to - once that day has passed in the user's own timezone, the
 * entry is locked, whether reached through this create/update path or
 * through `PATCH /journal/:id` (which routes through here with the
 * entry's own stored date, so it inherits the same lock automatically).
 */
export async function upsertJournalEntry(
  userId: string,
  input: Record<string, unknown>,
  timezone: string
): Promise<IJournalEntry> {
  const { date, mood, energy } = input as { date: string; mood?: string; energy?: number };

  const today = todayInTimezone(timezone);
  if (date !== today) {
    throw ApiError.badRequest("Journal entries can only be written or edited on the day they belong to.", "JOURNAL_LOCKED");
  }

  const isNew = !(await JournalEntry.exists({ userId, date }));
  const entry = await JournalEntry.findOneAndUpdate(
    { userId, date },
    { $set: { ...input, userId } },
    { upsert: true, new: true, runValidators: true }
  );

  if (mood && energy !== undefined) {
    await MoodEntry.findOneAndUpdate({ userId, date }, { $set: { userId, date, mood, energy } }, { upsert: true });
  }

  if (isNew) {
    evaluateAchievementsInBackground(userId, timezone);
  }

  return entry;
}

export async function getOwnedJournalEntry(userId: string, entryId: string): Promise<IJournalEntry> {
  const entry = await JournalEntry.findOne({ _id: entryId, userId });
  if (!entry) throw ApiError.notFound("Journal entry not found", "JOURNAL_NOT_FOUND");
  return entry;
}

export async function getJournalByDate(userId: string, date: string): Promise<IJournalEntry | null> {
  return JournalEntry.findOne({ userId, date });
}

export async function deleteJournalEntry(userId: string, entryId: string): Promise<void> {
  const entry = await getOwnedJournalEntry(userId, entryId);
  await entry.deleteOne();
}

export async function listJournalEntries(
  userId: string,
  filters: { start?: string; end?: string; mood?: string; tag?: string; search?: string },
  page: number,
  limit: number
) {
  const query: Record<string, unknown> = { userId };
  if (filters.start || filters.end) {
    query.date = {
      ...(filters.start ? { $gte: filters.start } : {}),
      ...(filters.end ? { $lte: filters.end } : {}),
    };
  }
  if (filters.mood) query.mood = filters.mood;
  if (filters.tag) query.tags = filters.tag;
  if (filters.search) {
    query.$or = [
      { content: { $regex: filters.search, $options: "i" } },
      { wentWell: { $regex: filters.search, $options: "i" } },
      { learned: { $regex: filters.search, $options: "i" } },
    ];
  }

  const [items, total] = await Promise.all([
    JournalEntry.find(query)
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    JournalEntry.countDocuments(query),
  ]);
  return { items, total };
}
