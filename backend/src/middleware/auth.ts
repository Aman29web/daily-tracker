import { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/ApiError";
import { catchAsync } from "../utils/catchAsync";
import { verifyAccessToken } from "../utils/jwt";
import { User } from "../models/User";

function extractToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) return header.slice(7);
  if (req.cookies?.accessToken) return req.cookies.accessToken;
  return null;
}

/**
 * Establishes req.user from the JWT. This is the ONLY source of identity for
 * every protected route — request bodies/query params must never be trusted
 * to carry a userId, so ownership checks always compare against req.user.id.
 */
export const requireAuth = catchAsync(async (req: Request, _res: Response, next: NextFunction) => {
  const token = extractToken(req);
  if (!token) throw ApiError.unauthorized("Authentication required", "NO_TOKEN");

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch {
    throw ApiError.unauthorized("Invalid or expired token", "INVALID_TOKEN");
  }

  const user = await User.findById(payload.sub).select("email timezone tokenVersion");
  if (!user) throw ApiError.unauthorized("User no longer exists", "USER_NOT_FOUND");
  if (user.tokenVersion !== payload.tokenVersion) {
    throw ApiError.unauthorized("Session has been invalidated", "TOKEN_REVOKED");
  }

  req.user = { id: user.id, email: user.email, timezone: user.timezone };
  next();
});
