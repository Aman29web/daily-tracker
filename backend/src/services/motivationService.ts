export interface MotivationContext {
  hour: number;
  productivityScore: number | null; // yesterday's or today's-so-far score, null if no data yet
  longestActiveStreak: number;
  habitsCompletedToday: number;
  habitsScheduledToday: number;
}

const GENERIC_QUOTES = [
  "Small progress every day.",
  "Discipline beats motivation.",
  "Your future self is watching.",
  "One good day becomes a good week.",
  "The goal isn't perfection. It's consistency.",
];

function pick<T>(items: T[], seed: number): T {
  return items[Math.abs(seed) % items.length];
}

/**
 * Picks one hero message deterministically for the given hour-of-day slot
 * (so it doesn't flicker between requests in the same window) but varies
 * across days via `seed` (typically derived from the date string).
 */
export function getHeroMessage(ctx: MotivationContext, seed: number): { message: string; tone: "morning" | "streak" | "hot" | "recovery" | "generic" } {
  if (ctx.hour < 11) {
    return { message: "Good morning. Make today count.", tone: "morning" };
  }

  if (ctx.habitsScheduledToday > 0 && ctx.habitsCompletedToday === ctx.habitsScheduledToday && ctx.habitsScheduledToday >= 3) {
    return { message: "You're on fire today 🔥", tone: "hot" };
  }

  if (ctx.longestActiveStreak >= 7) {
    return { message: `${ctx.longestActiveStreak} days strong. Keep going.`, tone: "streak" };
  }

  if (ctx.productivityScore !== null && ctx.productivityScore < 40) {
    return { message: "Yesterday is data, not destiny.", tone: "recovery" };
  }

  return { message: pick(GENERIC_QUOTES, seed), tone: "generic" };
}
