import { z } from "zod";
import { booleanQueryParam, objectIdSchema, paginationSchema } from "./common";

export const createPlanSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1).max(100),
    description: z.string().trim().max(500).optional(),
    category: z.string().trim().default("general"),
    icon: z.string().default("layers"),
    color: z.string().default("#6366f1"),
    isTemplate: z.boolean().default(false),
  }),
});

export const updatePlanSchema = z.object({
  params: z.object({ id: objectIdSchema }),
  body: z.object({
    name: z.string().trim().min(1).max(100).optional(),
    description: z.string().trim().max(500).optional(),
    category: z.string().trim().optional(),
    icon: z.string().optional(),
    color: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const listPlansQuerySchema = z.object({
  query: paginationSchema.extend({
    isArchived: booleanQueryParam,
    isTemplate: booleanQueryParam,
  }),
});
