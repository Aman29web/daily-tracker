import { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import { ZodError } from "zod";
import { ApiError } from "../utils/ApiError";
import { logger } from "../config/logger";
import { env } from "../config/env";

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
    errorCode: "ROUTE_NOT_FOUND",
  });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ApiError) {
    if (err.statusCode >= 500) logger.error(err.message, { errorCode: err.errorCode, stack: err.stack });
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errorCode: err.errorCode,
      ...(err.details ? { details: err.details } : {}),
    });
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errorCode: "VALIDATION_ERROR",
      details: err.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
    });
  }

  if (err instanceof mongoose.Error.ValidationError) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errorCode: "VALIDATION_ERROR",
      details: Object.values(err.errors).map((e) => e.message),
    });
  }

  if (err instanceof mongoose.Error.CastError) {
    return res.status(400).json({
      success: false,
      message: `Invalid value for ${err.path}`,
      errorCode: "INVALID_ID",
    });
  }

  if (typeof err === "object" && err !== null && "code" in err && (err as { code: number }).code === 11000) {
    return res.status(409).json({
      success: false,
      message: "A record with this value already exists",
      errorCode: "DUPLICATE_KEY",
    });
  }

  logger.error("Unhandled error", { err });
  return res.status(500).json({
    success: false,
    message: env.isProduction ? "Something went wrong" : (err as Error)?.message ?? "Something went wrong",
    errorCode: "INTERNAL_ERROR",
  });
}
