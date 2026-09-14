import { Types } from "mongoose";
import { FocusSession, IFocusSession } from "../models/FocusSession";
import { ApiError } from "../utils/ApiError";
import { todayInTimezone } from "../utils/dateUtils";
import { recalculateGoalProgress } from "./goalService";
import { evaluateAchievementsInBackground } from "./achievementService";

export async function getOwnedSession(userId: string, sessionId: string): Promise<IFocusSession> {
  const session = await FocusSession.findOne({ _id: sessionId, userId });
  if (!session) throw ApiError.notFound("Focus session not found", "FOCUS_SESSION_NOT_FOUND");
  return session;
}

export async function startSession(userId: string, timezone: string, input: Record<string, unknown>): Promise<IFocusSession> {
  const now = new Date();
  return FocusSession.create({
    ...input,
    userId,
    startTime: now,
    lastResumedAt: now,
    status: "running",
    date: todayInTimezone(timezone),
  });
}

function elapsedMinutesSince(date: Date): number {
  return Math.max(0, (Date.now() - date.getTime()) / 60000);
}

export async function pauseSession(userId: string, sessionId: string): Promise<IFocusSession> {
  const session = await getOwnedSession(userId, sessionId);
  if (session.status !== "running") throw ApiError.badRequest("Session is not running", "INVALID_SESSION_STATE");

  session.actualDuration += session.lastResumedAt ? elapsedMinutesSince(session.lastResumedAt) : 0;
  session.lastResumedAt = null;
  session.status = "paused";
  await session.save();
  return session;
}

export async function resumeSession(userId: string, sessionId: string): Promise<IFocusSession> {
  const session = await getOwnedSession(userId, sessionId);
  if (session.status !== "paused") throw ApiError.badRequest("Session is not paused", "INVALID_SESSION_STATE");

  session.lastResumedAt = new Date();
  session.status = "running";
  await session.save();
  return session;
}

async function finalizeSession(
  userId: string,
  sessionId: string,
  status: "completed" | "cancelled",
  timezone?: string
): Promise<IFocusSession> {
  const session = await getOwnedSession(userId, sessionId);
  if (session.status === "completed" || session.status === "cancelled") {
    throw ApiError.badRequest("Session already finished", "INVALID_SESSION_STATE");
  }

  if (session.status === "running" && session.lastResumedAt) {
    session.actualDuration += elapsedMinutesSince(session.lastResumedAt);
  }
  session.lastResumedAt = null;
  session.status = status;
  session.endTime = new Date();
  session.actualDuration = Math.round(session.actualDuration);
  await session.save();

  if (status === "completed") {
    if (session.goalId) await recalculateGoalProgress(userId, session.goalId.toString());
    if (timezone) evaluateAchievementsInBackground(userId, timezone);
  }
  return session;
}

export const completeSession = (userId: string, sessionId: string, timezone: string) =>
  finalizeSession(userId, sessionId, "completed", timezone);
export const cancelSession = (userId: string, sessionId: string) => finalizeSession(userId, sessionId, "cancelled");

export async function listSessions(
  userId: string,
  filters: { start?: string; end?: string; status?: string },
  page: number,
  limit: number
) {
  const query: Record<string, unknown> = { userId };
  if (filters.status) query.status = filters.status;
  if (filters.start || filters.end) {
    query.date = {
      ...(filters.start ? { $gte: filters.start } : {}),
      ...(filters.end ? { $lte: filters.end } : {}),
    };
  }

  const [items, total] = await Promise.all([
    FocusSession.find(query)
      .sort({ startTime: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    FocusSession.countDocuments(query),
  ]);
  return { items, total };
}

export async function getFocusMinutesForRange(userId: string, start: string, end: string): Promise<number> {
  const result = await FocusSession.aggregate([
    { $match: { userId: new Types.ObjectId(userId), date: { $gte: start, $lte: end }, status: "completed" } },
    { $group: { _id: null, minutes: { $sum: "$actualDuration" } } },
  ]);
  return Math.round(result[0]?.minutes ?? 0);
}
