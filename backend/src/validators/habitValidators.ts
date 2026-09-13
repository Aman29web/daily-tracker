import { z } from "zod";
import { SCHEDULE_TYPES } from "../types/enums";
import { booleanQueryParam, dateStringSchema, objectIdSchema, paginationSchema } from "./common";

const scheduleSchema = z
  .object({
    type: z.enum(SCHEDULE_TYPES),
    daysOfWeek: z.array(z.number().int().min(0).max(6)).default([]),
    timesPerPeriod: z.number().int().min(1).max(31).optional(),
    specificDates: z.array(dateStringSchema).default([]),
  })
  .superRefine((data, ctx) => {
    if (data.type === "weekdays" && data.daysOfWeek.length === 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Select at least one day of the week" });
    }
    if ((data.type === "x_per_week" || data.type === "x_per_month") && !data.timesPerPeriod) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "timesPerPeriod is required for this schedule type" });
    }
    if (data.type === "specific_dates" && data.specificDates.length === 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Provide at least one specific date" });
    }
  });

export const createHabitSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1).max(100),
    description: z.string().trim().max(500).optional(),
    icon: z.string().default("target"),
    color: z.string().default("#6366f1"),
    category: z.string().trim().default("general"),
    type: z.enum(["boolean", "numeric"]).default("boolean"),
    target: z.object({ value: z.number().positive(), unit: z.string() }).optional(),
    priority: z.enum(["low", "medium", "high"]).default("medium"),
    reminderTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
    startDate: dateStringSchema,
    endDate: dateStringSchema.nullable().optional(),
    planId: objectIdSchema.nullable().optional(),
    schedule: scheduleSchema,
  }),
});

export const updateHabitSchema = z.object({
  params: z.object({ id: objectIdSchema }),
  body: z.object({
    name: z.string().trim().min(1).max(100).optional(),
    description: z.string().trim().max(500).optional(),
    icon: z.string().optional(),
    color: z.string().optional(),
    category: z.string().trim().optional(),
    target: z.object({ value: z.number().positive(), unit: z.string() }).optional(),
    priority: z.enum(["low", "medium", "high"]).optional(),
    reminderTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).nullable().optional(),
    endDate: dateStringSchema.nullable().optional(),
    isActive: z.boolean().optional(),
    planId: objectIdSchema.nullable().optional(),
  }),
});

export const updateHabitScheduleSchema = z.object({
  params: z.object({ id: objectIdSchema }),
  body: z.object({
    schedule: scheduleSchema,
    effectiveFrom: dateStringSchema.optional(),
  }),
});

export const listHabitsQuerySchema = z.object({
  query: paginationSchema.extend({
    category: z.string().optional(),
    planId: objectIdSchema.optional(),
    isActive: booleanQueryParam,
    search: z.string().optional(),
  }),
});

export const checkInSchema = z.object({
  params: z.object({ id: objectIdSchema }),
  body: z.object({
    date: dateStringSchema,
    action: z.enum(["complete", "undo", "skip", "miss", "increment", "set_value"]),
    value: z.number().min(0).optional(),
    note: z.string().max(500).optional(),
  }),
});

export const habitRangeQuerySchema = z.object({
  params: z.object({ id: objectIdSchema }),
  query: z.object({
    start: dateStringSchema,
    end: dateStringSchema,
  }),
});
