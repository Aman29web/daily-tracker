import { z } from "zod";
import { GOAL_PROGRESS_SOURCES, GOAL_STATUSES } from "../types/enums";
import { dateStringSchema, objectIdSchema, paginationSchema } from "./common";

export const createGoalSchema = z.object({
  body: z.object({
    title: z.string().trim().min(1).max(150),
    description: z.string().trim().max(1000).optional(),
    category: z.string().trim().default("general"),
    targetValue: z.number().positive(),
    unit: z.string().trim().default("units"),
    progressSource: z.enum(GOAL_PROGRESS_SOURCES).default("manual"),
    linkedHabitIds: z.array(objectIdSchema).default([]),
    deadline: dateStringSchema.nullable().optional(),
  }),
});

export const updateGoalSchema = z.object({
  params: z.object({ id: objectIdSchema }),
  body: z.object({
    title: z.string().trim().min(1).max(150).optional(),
    description: z.string().trim().max(1000).optional(),
    category: z.string().trim().optional(),
    targetValue: z.number().positive().optional(),
    unit: z.string().trim().optional(),
    progressSource: z.enum(GOAL_PROGRESS_SOURCES).optional(),
    linkedHabitIds: z.array(objectIdSchema).optional(),
    deadline: dateStringSchema.nullable().optional(),
    status: z.enum(GOAL_STATUSES).optional(),
  }),
});

export const updateGoalProgressSchema = z.object({
  params: z.object({ id: objectIdSchema }),
  body: z.object({
    currentValue: z.number().min(0),
  }),
});

export const listGoalsQuerySchema = z.object({
  query: paginationSchema.extend({
    status: z.enum(GOAL_STATUSES).optional(),
    category: z.string().optional(),
  }),
});
