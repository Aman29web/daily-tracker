import { z } from "zod";
import { MOODS } from "../types/enums";
import { dateStringSchema, paginationSchema } from "./common";

export const upsertJournalSchema = z.object({
  body: z.object({
    date: dateStringSchema,
    wentWell: z.string().trim().max(3000).optional(),
    wentWrong: z.string().trim().max(3000).optional(),
    learned: z.string().trim().max(3000).optional(),
    improveTomorrow: z.string().trim().max(3000).optional(),
    content: z.string().trim().max(5000).optional(),
    mood: z.enum(MOODS).optional(),
    energy: z.number().min(0).max(100).optional(),
    tags: z.array(z.string().trim().max(30)).max(20).default([]),
  }),
});

export const listJournalQuerySchema = z.object({
  query: paginationSchema.extend({
    start: dateStringSchema.optional(),
    end: dateStringSchema.optional(),
    mood: z.enum(MOODS).optional(),
    tag: z.string().optional(),
    search: z.string().optional(),
  }),
});

export const upsertMoodSchema = z.object({
  body: z.object({
    date: dateStringSchema,
    mood: z.enum(MOODS),
    energy: z.number().min(0).max(100),
  }),
});

export const listMoodQuerySchema = z.object({
  query: z.object({
    start: dateStringSchema.optional(),
    end: dateStringSchema.optional(),
  }),
});
