import { Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync";
import { buildPagination, sendSuccess } from "../utils/ApiResponse";
import * as journalService from "../services/journalService";
import * as moodService from "../services/moodService";

export const upsertJournal = catchAsync(async (req: Request, res: Response) => {
  const entry = await journalService.upsertJournalEntry(req.user!.id, req.body, req.user!.timezone);
  sendSuccess(res, entry, "Journal entry saved");
});

export const listJournal = catchAsync(async (req: Request, res: Response) => {
  const { page, limit, ...filters } = req.query as unknown as {
    page: number;
    limit: number;
    start?: string;
    end?: string;
    mood?: string;
    tag?: string;
    search?: string;
  };
  const { items, total } = await journalService.listJournalEntries(req.user!.id, filters, page, limit);
  sendSuccess(res, items, "Journal entries retrieved", 200, { pagination: buildPagination(page, limit, total) });
});

export const getJournalByDate = catchAsync(async (req: Request, res: Response) => {
  const entry = await journalService.getJournalByDate(req.user!.id, req.params.date);
  sendSuccess(res, entry);
});

export const updateJournal = catchAsync(async (req: Request, res: Response) => {
  const entry = await journalService.getOwnedJournalEntry(req.user!.id, req.params.id);
  const updated = await journalService.upsertJournalEntry(req.user!.id, { ...req.body, date: entry.date }, req.user!.timezone);
  sendSuccess(res, updated, "Journal entry updated");
});

export const deleteJournal = catchAsync(async (req: Request, res: Response) => {
  await journalService.deleteJournalEntry(req.user!.id, req.params.id);
  sendSuccess(res, null, "Journal entry deleted");
});

export const upsertMood = catchAsync(async (req: Request, res: Response) => {
  const { date, mood, energy } = req.body;
  const entry = await moodService.upsertMoodEntry(req.user!.id, date, mood, energy);
  sendSuccess(res, entry, "Mood recorded");
});

export const listMood = catchAsync(async (req: Request, res: Response) => {
  const { start, end } = req.query as unknown as { start?: string; end?: string };
  const entries = await moodService.listMoodEntries(req.user!.id, start, end);
  sendSuccess(res, entries);
});
