import { z } from "zod";
import { dateStringSchema, objectIdSchema } from "./common";

export const createPauseSchema = z.object({
  body: z
    .object({
      planId: objectIdSchema.optional(),
      habitId: objectIdSchema.optional(),
      startDate: dateStringSchema,
      endDate: dateStringSchema,
      reason: z.string().max(200).optional(),
    })
    .superRefine((data, ctx) => {
      if (!data.planId && !data.habitId) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Either planId or habitId is required" });
      }
      if (data.planId && data.habitId) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Provide only one of planId or habitId" });
      }
      if (data.endDate < data.startDate) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "endDate must be on or after startDate" });
      }
    }),
});
