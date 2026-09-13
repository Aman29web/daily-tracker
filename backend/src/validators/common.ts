import { z } from "zod";
import { isValidDateString } from "../utils/dateUtils";

export const dateStringSchema = z.string().refine(isValidDateString, "Expected date in YYYY-MM-DD format");

export const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid id");

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

/**
 * A boolean coming from a query string. `z.coerce.boolean()` looks right
 * for this but silently does the wrong thing here: it coerces via JS's
 * `Boolean(value)`, and every non-empty string is truthy - so a real
 * `?flag=false` on the wire becomes `Boolean("false") === true`. This
 * accepts the literal strings query params actually arrive as (plus a
 * genuine boolean, in case a caller ever passes one directly) and maps
 * "false" to `false`.
 */
export const booleanQueryParam = z
  .union([z.literal("true"), z.literal("false"), z.boolean()])
  .transform((value) => (typeof value === "boolean" ? value : value === "true"))
  .optional();

export const idParamSchema = z.object({
  params: z.object({ id: objectIdSchema }),
});
