import { z } from "zod";
import { TASK_PRIORITIES, TASK_STATUSES } from "../types/enums";
import { dateStringSchema, objectIdSchema, paginationSchema } from "./common";

export const createTaskSchema = z.object({
  body: z.object({
    title: z.string().trim().min(1).max(200),
    description: z.string().trim().max(2000).optional(),
    priority: z.enum(TASK_PRIORITIES).default("medium"),
    dueDate: dateStringSchema.nullable().optional(),
    category: z.string().trim().default("general"),
    estimatedDuration: z.number().positive().optional(),
    goalId: objectIdSchema.nullable().optional(),
    planId: objectIdSchema.nullable().optional(),
  }),
});

export const updateTaskSchema = z.object({
  params: z.object({ id: objectIdSchema }),
  body: z.object({
    title: z.string().trim().min(1).max(200).optional(),
    description: z.string().trim().max(2000).optional(),
    priority: z.enum(TASK_PRIORITIES).optional(),
    dueDate: dateStringSchema.nullable().optional(),
    status: z.enum(TASK_STATUSES).optional(),
    category: z.string().trim().optional(),
    estimatedDuration: z.number().positive().optional(),
    actualDuration: z.number().min(0).optional(),
    goalId: objectIdSchema.nullable().optional(),
    order: z.number().optional(),
  }),
});

export const listTasksQuerySchema = z.object({
  query: paginationSchema.extend({
    status: z.enum(TASK_STATUSES).optional(),
    priority: z.enum(TASK_PRIORITIES).optional(),
    category: z.string().optional(),
    goalId: objectIdSchema.optional(),
    search: z.string().optional(),
    dueBefore: dateStringSchema.optional(),
    dueAfter: dateStringSchema.optional(),
  }),
});

export const setTop3Schema = z.object({
  body: z.object({
    date: dateStringSchema,
    taskIds: z.array(objectIdSchema).max(3),
  }),
});

export const reorderTasksSchema = z.object({
  body: z.object({
    orderedIds: z.array(objectIdSchema).min(1),
  }),
});
