import { z } from "zod";
import { FOCUS_MODES } from "../types/enums";
import { dateStringSchema, objectIdSchema, paginationSchema } from "./common";

export const startFocusSchema = z.object({
  body: z.object({
    mode: z.enum(FOCUS_MODES).default("25"),
    plannedDuration: z.number().positive().max(600),
    taskId: objectIdSchema.nullable().optional(),
    goalId: objectIdSchema.nullable().optional(),
    category: z.string().trim().default("general"),
  }),
});

export const listFocusQuerySchema = z.object({
  query: paginationSchema.extend({
    start: dateStringSchema.optional(),
    end: dateStringSchema.optional(),
    status: z.string().optional(),
  }),
});
