export interface AIPromptContext {
  systemPrompt: string;
  userPrompt: string;
  data: Record<string, unknown>;
}

export interface AIProvider {
  complete(context: AIPromptContext): Promise<string>;
}

/**
 * Default provider when AI_PROVIDER=none (the out-of-the-box setting - see
 * .env.example). It never calls an external model; instead it renders the
 * already-computed, real aggregates in `data` into readable prose, so
 * "Never fabricate user statistics" holds even with zero external
 * integration configured. Swapping in a real LLM later means implementing
 * AIProvider against `context.data` (which already carries the structured,
 * verified numbers) and selecting it in ai/AIService.ts by env.aiProvider -
 * no controller or route changes required.
 */
export class DeterministicProvider implements AIProvider {
  async complete(context: AIPromptContext): Promise<string> {
    return renderDeterministic(context.data);
  }
}

function renderDeterministic(data: Record<string, unknown>): string {
  const lines: string[] = [];
  for (const [key, value] of Object.entries(data)) {
    if (value === null || value === undefined) continue;
    if (Array.isArray(value)) {
      if (!value.length) continue;
      lines.push(`${humanize(key)}: ${value.map((v) => (typeof v === "object" ? JSON.stringify(v) : v)).join(", ")}`);
    } else if (typeof value === "object") {
      lines.push(`${humanize(key)}: ${JSON.stringify(value)}`);
    } else {
      lines.push(`${humanize(key)}: ${value}`);
    }
  }
  return lines.join("\n");
}

function humanize(key: string): string {
  return key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());
}

const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

/**
 * Google Gemini, via the plain REST `generateContent` endpoint (no SDK
 * dependency needed - one fetch call). The prompt always embeds the exact
 * structured `data` this service already computed server-side and instructs
 * the model to reason only from it, so grounding is enforced the same way
 * regardless of which provider is active.
 *
 * Model defaults to the `gemini-flash-latest` alias rather than a pinned
 * version: Gemini model IDs rotate/deprecate fairly often, and a pinned
 * version silently 404s or 401s once retired. The alias is hot-swapped by
 * Google to whatever the current Flash release is, so this integration
 * doesn't go stale on its own. Override via AI_MODEL if a specific version
 * is ever needed.
 */
export class GeminiProvider implements AIProvider {
  constructor(
    private apiKey: string,
    private model: string
  ) {}

  async complete(context: AIPromptContext): Promise<string> {
    const url = `${GEMINI_API_BASE}/${encodeURIComponent(this.model)}:generateContent`;

    const body = {
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `${context.userPrompt}\n\nHere is the real, verified data to base your answer on - do not reference or invent any numbers that aren't in it:\n${JSON.stringify(context.data)}`,
            },
          ],
        },
      ],
      systemInstruction: { parts: [{ text: context.systemPrompt }] },
      generationConfig: { temperature: 0.4, maxOutputTokens: 700 },
    };

    // Google's free tier returns transient 503 ("high demand") / 429 (rate limit)
    // fairly often; one short-backoff retry clears most of them without making
    // the caller (AIService.generate, which already has its own fallback) wait long.
    const MAX_ATTEMPTS = 3;
    let lastError: unknown;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        return await this.attempt(url, body);
      } catch (err) {
        lastError = err;
        const retriable = err instanceof RetriableError;
        if (!retriable || attempt === MAX_ATTEMPTS) throw err;
        await sleep(500 * attempt);
      }
    }
    throw lastError;
  }

  private async attempt(url: string, body: unknown): Promise<string> {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": this.apiKey },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      const message = `Gemini API error ${res.status}: ${errText.slice(0, 300)}`;
      if (res.status === 503 || res.status === 429) throw new RetriableError(message);
      throw new Error(message);
    }

    const json = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[];
      promptFeedback?: { blockReason?: string };
    };

    if (json.promptFeedback?.blockReason) {
      throw new Error(`Gemini blocked the prompt: ${json.promptFeedback.blockReason}`);
    }

    const text = json.candidates?.[0]?.content?.parts
      ?.map((p) => p.text ?? "")
      .join("")
      .trim();
    if (!text) throw new Error("Gemini API returned no text content");
    return text;
  }
}

class RetriableError extends Error {}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
