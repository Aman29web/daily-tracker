import argon2 from "argon2";
import crypto from "crypto";
import { User, IUser } from "../models/User";
import { UserSettings } from "../models/UserSettings";
import { signAccessToken, signRefreshToken } from "../utils/jwt";
import { ApiError } from "../utils/ApiError";

export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password);
}

export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  return argon2.verify(hash, password);
}

export function issueTokenPair(user: IUser) {
  const accessToken = signAccessToken({ sub: user.id, email: user.email, tokenVersion: user.tokenVersion });
  const refreshToken = signRefreshToken({ sub: user.id, tokenVersion: user.tokenVersion });
  return { accessToken, refreshToken };
}

export async function registerUser(input: { name: string; email: string; password: string; timezone: string }) {
  const existing = await User.findOne({ email: input.email });
  if (existing) throw ApiError.conflict("An account with this email already exists", "EMAIL_TAKEN");

  const passwordHash = await hashPassword(input.password);
  const user = await User.create({
    name: input.name,
    email: input.email,
    passwordHash,
    timezone: input.timezone,
  });
  await UserSettings.create({ userId: user._id });
  return user;
}

export async function authenticateUser(email: string, password: string): Promise<IUser> {
  const user = await User.findOne({ email }).select("+passwordHash");
  if (!user) throw ApiError.unauthorized("Invalid email or password", "INVALID_CREDENTIALS");

  const valid = await verifyPassword(user.passwordHash, password);
  if (!valid) throw ApiError.unauthorized("Invalid email or password", "INVALID_CREDENTIALS");

  user.lastLoginAt = new Date();
  await user.save();
  return user;
}

/** Random opaque token for password reset; only its hash is stored. */
export function generateResetToken(): { token: string; tokenHash: string } {
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  return { token, tokenHash };
}

export function hashResetToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}
