import { z } from "zod";
import { dateStringSchema } from "./common";

export const askAiSchema = z.object({
  body: z.object({
    question: z.string().trim().min(1).max(500),
  }),
});

export const journalSummarySchema = z.object({
  query: z.object({
    start: dateStringSchema,
    end: dateStringSchema,
  }),
});
