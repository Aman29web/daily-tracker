import winston from "winston";
import { env } from "./env";

const { combine, timestamp, printf, colorize, errors } = winston.format;

/**
 * `winston.format.errors()` only unwraps an Error when it IS the log's
 * primary argument (`logger.error(someError)`); it doesn't look inside
 * metadata. This codebase's actual pattern is `logger.warn("...", { err })`,
 * and a bare Error serializes to `{}` via JSON.stringify (message/stack
 * are non-enumerable) - silently discarding the one thing you need to
 * debug the failure. This walks the metadata and unwraps any Error found
 * one level deep.
 */
const unwrapNestedErrors = winston.format((info) => {
  for (const key of Object.keys(info)) {
    const value = (info as Record<string, unknown>)[key];
    if (value instanceof Error) {
      (info as Record<string, unknown>)[key] = { ...value, message: value.message, stack: value.stack };
    }
  }
  return info;
});

const devFormat = combine(
  unwrapNestedErrors(),
  colorize(),
  timestamp({ format: "HH:mm:ss" }),
  errors({ stack: true }),
  printf(({ level, message, timestamp: ts, stack, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
    return `${ts} ${level}: ${stack ?? message}${metaStr}`;
  })
);

const prodFormat = combine(unwrapNestedErrors(), timestamp(), errors({ stack: true }), winston.format.json());

export const logger = winston.createLogger({
  level: env.logLevel,
  format: env.isProduction ? prodFormat : devFormat,
  transports: [new winston.transports.Console({ silent: env.isTest })],
});
