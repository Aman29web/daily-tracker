import { env } from "../config/env";
import { logger } from "../config/logger";
import { AIProvider, DeterministicProvider, GeminiProvider } from "./AIProvider";
import * as analyticsService from "../services/analyticsService";
import * as goalService from "../services/goalService";
import { Goal } from "../models/Goal";
import { JournalEntry } from "../models/JournalEntry";
import { getOrGenerateDailySummary } from "../services/dailySummaryService";
import { todayInTimezone } from "../utils/dateUtils";

const DEFAULT_GEMINI_MODEL = "gemini-flash-latest";

/**
 * Provider-agnostic AI assistant. `AI_PROVIDER` selects the backing model;
 * "none" (the default - see .env.example) uses DeterministicProvider, which
 * never contacts an external service. Adding a real provider is a matter of
 * implementing AIProvider and adding a case below - nothing else in the app
 * depends on which one is active.
 */
function resolveProvider(): AIProvider {
  switch (env.aiProvider) {
    case "gemini":
      if (!env.aiApiKey) {
        logger.warn("AI_PROVIDER=gemini but AI_API_KEY is not set - falling back to deterministic summaries");
        return new DeterministicProvider();
      }
      return new GeminiProvider(env.aiApiKey, env.aiModel || DEFAULT_GEMINI_MODEL);
    case "none":
    default:
      return new DeterministicProvider();
  }
}

const provider = resolveProvider();
const usingRealProvider = env.aiProvider !== "none";

/**
 * Runs the real provider when one is configured, always falling back to the
 * hand-written deterministic summary (same as the AI_PROVIDER=none path) if
 * the call fails for any reason - a flaky/rate-limited/misconfigured AI
 * provider should degrade the feature, never break it.
 */
async function generate(
  systemPrompt: string,
  userPrompt: string,
  data: Record<string, unknown>,
  fallback: () => string
): Promise<string> {
  if (!usingRealProvider) return fallback();
  try {
    return await provider.complete({ systemPrompt, userPrompt, data });
  } catch (err) {
    logger.warn("AI provider call failed, falling back to deterministic summary", { err });
    return fallback();
  }
}

/** Same idea as `generate`, but for endpoints that return a short list of bullet-style strings. */
async function generateList(
  systemPrompt: string,
  userPrompt: string,
  data: Record<string, unknown>,
  fallback: () => string[]
): Promise<string[]> {
  if (!usingRealProvider) return fallback();
  try {
    const text = await provider.complete({
      systemPrompt: `${systemPrompt} Respond with one short recommendation per line, no numbering or bullets, no preamble.`,
      userPrompt,
      data,
    });
    const lines = text
      .split("\n")
      .map((l) => l.replace(/^[-*•\d.)\s]+/, "").trim())
      .filter(Boolean)
      .slice(0, 6);
    return lines.length ? lines : fallback();
  } catch (err) {
    logger.warn("AI provider call failed, falling back to deterministic recommendations", { err });
    return fallback();
  }
}

const GROUNDING_RULE =
  "You are a productivity coach embedded in a habit-tracking app. Base every statement strictly on the JSON data provided - never invent numbers, habit names, or events that aren't in it. If the data is too sparse to say something meaningful, say so plainly instead of guessing. Keep the tone encouraging but honest, and keep the answer concise.";

/** Shared by weeklyReview's own fallback and ask()'s fallback (a free-form question has no natural hand-written answer, so it falls back to this same real-data summary instead). */
function formatWeeklySummary(report: Awaited<ReturnType<typeof analyticsService.getWeeklyReport>>): string {
  const parts: string[] = [];
  parts.push(`This week your average productivity was ${report.productivityAvg}/100 with ${report.habitsCompletionAvg}% habit completion.`);
  parts.push(`You focused for a total of ${Math.floor(report.focusMinutesTotal / 60)}h ${report.focusMinutesTotal % 60}m.`);
  parts.push(`You journaled on ${report.journalDays} of ${report.totalDays} days.`);
  if (report.topHabit) parts.push(`Your most consistent habit was "${report.topHabit.name}" at ${report.topHabit.completionRate}%.`);
  if (report.mostMissedHabit)
    parts.push(`Your most-missed habit was "${report.mostMissedHabit.name}" (${report.mostMissedHabit.missRate}% missed).`);
  if (report.bestDay) parts.push(`Your best day was ${report.bestDay.date} with a score of ${report.bestDay.score}.`);
  if (report.worstDay) parts.push(`Your toughest day was ${report.worstDay.date} with a score of ${report.worstDay.score}.`);
  return parts.join(" ");
}

export const AIService = {
  async dailyAnalysis(userId: string, date: string, timezone: string): Promise<string> {
    const summary = await getOrGenerateDailySummary(userId, date, timezone);

    const fallback = () => {
      const parts: string[] = [];
      parts.push(`On ${date} you scored ${summary.productivityScore}/100 for productivity.`);
      if (summary.habitsScheduled > 0) {
        parts.push(`You completed ${summary.habitsCompleted} of ${summary.habitsScheduled} scheduled habits.`);
      } else {
        parts.push("No habits were scheduled that day.");
      }
      if (summary.tasksTotal > 0) {
        parts.push(`${summary.tasksCompleted} of ${summary.tasksTotal} due tasks were completed.`);
      }
      if (summary.focusMinutes > 0) {
        parts.push(
          `You focused for ${Math.floor(summary.focusMinutes / 60)}h ${summary.focusMinutes % 60}m across ${summary.focusSessions} session(s).`
        );
      }
      if (summary.mood) parts.push(`Mood was recorded as "${summary.mood}".`);
      if (summary.top3Total > 0) parts.push(`You completed ${summary.top3Completed} of your top ${summary.top3Total} priorities.`);
      return parts.join(" ");
    };

    return generate(
      GROUNDING_RULE,
      `Write a short (2-4 sentence) analysis of how ${date} went for this user, based on their daily summary below.`,
      { date, dailySummary: summary },
      fallback
    );
  },

  async weeklyReview(userId: string, timezone: string): Promise<string> {
    const report = await analyticsService.getWeeklyReport(userId, todayInTimezone(timezone), timezone, 1);
    const fallback = () => formatWeeklySummary(report);

    return generate(
      GROUNDING_RULE,
      "Write a short weekly review (3-5 sentences) summarizing this user's week, calling out one specific strength and one specific area to improve, using the weekly report data below.",
      { weeklyReport: report },
      fallback
    );
  },

  async habitRecommendations(userId: string, timezone: string): Promise<string[]> {
    const insights = await analyticsService.getInsights(userId, timezone);
    const habitInsights = insights.filter((i) => i.category === "habit").map((i) => i.text);
    const profile = await analyticsService.getProductivityProfile(userId, timezone);

    const fallback = () => {
      const recs: string[] = [...habitInsights];
      if (profile.weakestHabit) {
        recs.push(`Consider reviewing the schedule for "${profile.weakestHabit}" - it currently has your lowest completion rate.`);
      }
      if (!recs.length) {
        recs.push("Keep logging check-ins - recommendations improve as more habit history builds up.");
      }
      return recs;
    };

    return generateList(
      GROUNDING_RULE,
      "Suggest up to 4 concrete, specific habit recommendations for this user based on their insights and productivity profile below (e.g. which habit to adjust, drop, or reinforce, and why).",
      { insights, profile },
      fallback
    );
  },

  async goalRecommendations(userId: string, timezone: string): Promise<string[]> {
    const goals = await Goal.find({ userId, status: "active" });
    const today = todayInTimezone(timezone);
    const paces = goals.map((goal) => ({ goal, pace: goalService.computeGoalPace(goal, today) }));

    const fallback = () => {
      const recs: string[] = [];
      for (const { goal, pace } of paces) {
        if (pace.onTrack === false && pace.requiredPacePerDay !== null) {
          recs.push(
            `"${goal.title}" needs about ${Math.round(pace.requiredPacePerDay * 10) / 10} ${goal.unit}/day to finish by ${goal.deadline}, above your current pace of ${Math.round(pace.currentPacePerDay * 10) / 10}/day.`
          );
        } else if (pace.progressPercent >= 90) {
          recs.push(`"${goal.title}" is at ${pace.progressPercent}% - you're close to finishing it.`);
        }
      }
      if (!recs.length) recs.push("Your active goals are on track. No changes recommended right now.");
      return recs;
    };

    return generateList(
      GROUNDING_RULE,
      "Suggest up to 4 concrete recommendations for this user's active goals based on their pace data below (e.g. increase daily pace, adjust deadline, or celebrate being close to done).",
      { goals: paces.map(({ goal, pace }) => ({ title: goal.title, unit: goal.unit, deadline: goal.deadline, ...pace })) },
      fallback
    );
  },

  async journalSummary(userId: string, start: string, end: string): Promise<string> {
    const entries = await JournalEntry.find({ userId, date: { $gte: start, $lte: end } }).sort({ date: 1 });
    if (!entries.length) return "No journal entries in this range yet.";

    const fallback = () => {
      const highlights = entries
        .map((e) => e.learned || e.wentWell)
        .filter((text): text is string => !!text && text.trim().length > 0)
        .slice(0, 10);
      if (!highlights.length) return `You wrote ${entries.length} journal entr${entries.length === 1 ? "y" : "ies"} in this range.`;
      return `Across ${entries.length} entries: ${highlights.join(" | ")}`;
    };

    return generate(
      GROUNDING_RULE,
      `Summarize this user's journal entries from ${start} to ${end} in 3-5 sentences, noting any recurring themes, moods, or lessons - using only what they actually wrote below.`,
      {
        entries: entries.map((e) => ({
          date: e.date,
          mood: e.mood,
          wentWell: e.wentWell,
          wentWrong: e.wentWrong,
          learned: e.learned,
          improveTomorrow: e.improveTomorrow,
          content: e.content,
        })),
      },
      fallback
    );
  },

  async ask(userId: string, question: string, timezone: string): Promise<string> {
    const [weekly, insights, profile] = await Promise.all([
      analyticsService.getWeeklyReport(userId, todayInTimezone(timezone), timezone, 1),
      analyticsService.getInsights(userId, timezone),
      analyticsService.getProductivityProfile(userId, timezone),
    ]);

    const data = { question, weeklyReport: weekly, insights, profile };
    // A free-form question has no natural hand-written answer, so both the
    // "no provider configured" and "provider call failed" paths fall back
    // to the same readable weekly summary rather than a raw JSON dump.
    const fallback = () => {
      const reason = usingRealProvider
        ? "The AI assistant is temporarily unavailable, so here's a summary from your real data instead:"
        : "Free-form questions need an AI provider configured - here's a summary from your real data instead:";
      return `${reason} ${formatWeeklySummary(weekly)}`;
    };

    if (!usingRealProvider) return fallback();
    try {
      return await provider.complete({ systemPrompt: GROUNDING_RULE, userPrompt: question, data });
    } catch (err) {
      logger.warn("AI provider call failed, falling back to deterministic answer", { err });
      return fallback();
    }
  },
};
