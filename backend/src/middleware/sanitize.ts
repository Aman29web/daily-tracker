import { NextFunction, Request, Response } from "express";

/** Strips keys starting with "$" or containing "." from req.body/query/params to block NoSQL injection. */
function sanitizeValue<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((v) => sanitizeValue(v)) as unknown as T;
  }
  if (value !== null && typeof value === "object") {
    const clean: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      if (key.startsWith("$") || key.includes(".")) continue;
      clean[key] = sanitizeValue(val);
    }
    return clean as T;
  }
  return value;
}

export function sanitizeRequest(req: Request, _res: Response, next: NextFunction) {
  if (req.body) req.body = sanitizeValue(req.body);
  if (req.params) req.params = sanitizeValue(req.params);
  next();
}
