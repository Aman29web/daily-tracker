import { Request, Response } from "express";
import { CookieOptions } from "express";
import { catchAsync } from "../utils/catchAsync";
import { sendSuccess } from "../utils/ApiResponse";
import { ApiError } from "../utils/ApiError";
import { env } from "../config/env";
import { User, IUser } from "../models/User";
import { UserSettings } from "../models/UserSettings";
import {
  authenticateUser,
  generateResetToken,
  hashPassword,
  hashResetToken,
  issueTokenPair,
  registerUser,
  verifyPassword,
} from "../services/authService";
import { verifyRefreshToken } from "../utils/jwt";
import { logger } from "../config/logger";

const REFRESH_COOKIE = "refreshToken";

/**
 * "lax" works fine in local dev (frontend/backend differ only by port,
 * which browsers still treat as the same site) but browsers refuse to
 * attach a "lax" cookie to the cross-site fetch/XHR calls a separately
 * hosted frontend (e.g. Vercel) makes to this API (e.g. Render) - the
 * refresh call would silently stop sending the cookie at all. Cross-site
 * cookies require "none", which in turn requires `secure: true` (only
 * possible over HTTPS, which is why this is gated on production).
 */
const refreshCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: env.cookieSecure,
  sameSite: env.isProduction ? "none" : "lax",
  path: "/api/auth",
  maxAge: 30 * 24 * 60 * 60 * 1000,
};

function publicUser(user: IUser) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    timezone: user.timezone,
    avatarColor: user.avatarColor,
    createdAt: user.createdAt,
  };
}

/**
 * refreshToken is included in the JSON body (in addition to the httpOnly
 * cookie) so that clients with no cookie jar - the mobile app - can persist
 * it themselves (expo-secure-store) and send it explicitly on /auth/refresh.
 * The web app never reads this field and keeps relying solely on the
 * cookie, so this is purely additive.
 */
export const register = catchAsync(async (req: Request, res: Response) => {
  const user = await registerUser(req.body);
  const { accessToken, refreshToken } = issueTokenPair(user);
  res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions);
  sendSuccess(res, { user: publicUser(user), accessToken, refreshToken }, "Account created", 201);
});

export const login = catchAsync(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const user = await authenticateUser(email, password);
  const { accessToken, refreshToken } = issueTokenPair(user);
  res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions);
  sendSuccess(res, { user: publicUser(user), accessToken, refreshToken }, "Logged in");
});

export const logout = catchAsync(async (req: Request, res: Response) => {
  res.clearCookie(REFRESH_COOKIE, { path: "/api/auth" });
  sendSuccess(res, null, "Logged out");
});

export const refresh = catchAsync(async (req: Request, res: Response) => {
  // Cookie for web; falls back to a body-supplied token for mobile, which has no cookie jar.
  const token = req.cookies?.[REFRESH_COOKIE] ?? req.body?.refreshToken;
  if (!token) throw ApiError.unauthorized("No refresh token", "NO_REFRESH_TOKEN");

  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    throw ApiError.unauthorized("Invalid or expired refresh token", "INVALID_REFRESH_TOKEN");
  }

  const user = await User.findById(payload.sub);
  if (!user || user.tokenVersion !== payload.tokenVersion) {
    throw ApiError.unauthorized("Session has been invalidated", "TOKEN_REVOKED");
  }

  const { accessToken, refreshToken } = issueTokenPair(user);
  res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions);
  sendSuccess(res, { user: publicUser(user), accessToken, refreshToken }, "Token refreshed");
});

export const getMe = catchAsync(async (req: Request, res: Response) => {
  const user = await User.findById(req.user!.id);
  if (!user) throw ApiError.notFound("User not found", "USER_NOT_FOUND");
  const settings = await UserSettings.findOne({ userId: user._id });
  sendSuccess(res, { user: publicUser(user), settings });
});

export const updateProfile = catchAsync(async (req: Request, res: Response) => {
  const user = await User.findByIdAndUpdate(req.user!.id, { $set: req.body }, { new: true, runValidators: true });
  if (!user) throw ApiError.notFound("User not found", "USER_NOT_FOUND");
  sendSuccess(res, { user: publicUser(user) }, "Profile updated");
});

export const changePassword = catchAsync(async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user!.id).select("+passwordHash");
  if (!user) throw ApiError.notFound("User not found", "USER_NOT_FOUND");

  const valid = await verifyPassword(user.passwordHash, currentPassword);
  if (!valid) throw ApiError.unauthorized("Current password is incorrect", "INVALID_PASSWORD");

  user.passwordHash = await hashPassword(newPassword);
  user.tokenVersion += 1; // invalidate all existing sessions/refresh tokens
  await user.save();

  const { accessToken, refreshToken } = issueTokenPair(user);
  res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions);
  sendSuccess(res, { accessToken, refreshToken }, "Password changed");
});

/**
 * Forgot/reset password architecture: issues a single-use, hashed, expiring
 * token. Delivery is intentionally deferred - wiring an email provider is a
 * separate integration (see notifications/NotificationService) - so in
 * non-production environments the raw token is returned in the response to
 * keep the flow testable end-to-end without an inbox.
 */
export const forgotPassword = catchAsync(async (req: Request, res: Response) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (user) {
    const { token, tokenHash } = generateResetToken();
    user.passwordResetTokenHash = tokenHash;
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();
    logger.info(`Password reset requested for ${email}`);

    return sendSuccess(
      res,
      { resetToken: env.isProduction ? undefined : token },
      "If that email exists, a reset link has been sent"
    );
  }

  // Same response whether or not the account exists, to avoid leaking which emails are registered.
  sendSuccess(res, {}, "If that email exists, a reset link has been sent");
});

export const resetPassword = catchAsync(async (req: Request, res: Response) => {
  const { token, newPassword } = req.body;
  const tokenHash = hashResetToken(token);

  const user = await User.findOne({
    passwordResetTokenHash: tokenHash,
    passwordResetExpires: { $gt: new Date() },
  }).select("+passwordResetTokenHash +passwordResetExpires");

  if (!user) throw ApiError.badRequest("Reset token is invalid or has expired", "INVALID_RESET_TOKEN");

  user.passwordHash = await hashPassword(newPassword);
  user.passwordResetTokenHash = undefined;
  user.passwordResetExpires = undefined;
  user.tokenVersion += 1;
  await user.save();

  sendSuccess(res, {}, "Password has been reset");
});
