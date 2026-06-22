/**
 * Retry helpers for AI provider calls.
 *
 * The Gemini free tier is rate limited to ~5 requests/minute and returns 429s
 * under load (batch categorization, parallel image evaluation). These helpers
 * add exponential backoff with jitter on transient errors, and a small
 * concurrency limiter so we never fan out more calls than the provider allows.
 */

/** Detect a rate-limit (429) or transient/overloaded provider error. */
export function isRetryableAiError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;

  // AI SDK errors expose statusCode; fetch/Response errors expose status.
  const status =
    (error as { statusCode?: number }).statusCode ??
    (error as { status?: number }).status;
  if (status === 429 || status === 503 || status === 500) return true;

  const message = ((error as { message?: string }).message ?? '').toLowerCase();
  return (
    message.includes('rate limit') ||
    message.includes('429') ||
    message.includes('quota') ||
    message.includes('overloaded') ||
    message.includes('resource_exhausted') ||
    message.includes('try again') ||
    message.includes('timeout')
  );
}

export interface RetryOptions {
  /** Max attempts including the first call. Default 4. */
  maxAttempts?: number;
  /** Base delay in ms for the first backoff. Default 2000. */
  baseDelayMs?: number;
  /** Cap on any single backoff wait. Default 30000. */
  maxDelayMs?: number;
  /** Label for logging. */
  label?: string;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * Run an async fn with exponential backoff + jitter on retryable errors.
 * Non-retryable errors are thrown immediately. Re-throws the last error if
 * all attempts are exhausted.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const {
    maxAttempts = 4,
    baseDelayMs = 2000,
    maxDelayMs = 30000,
    label = 'ai-call',
  } = options;

  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt >= maxAttempts || !isRetryableAiError(error)) {
        throw error;
      }

      // Exponential backoff with full jitter, capped.
      const exp = baseDelayMs * 2 ** (attempt - 1);
      const capped = Math.min(exp, maxDelayMs);
      const jittered = Math.round(capped / 2 + (Math.random() * capped) / 2);

      console.warn(
        `[ai-retry] ${label} attempt ${attempt}/${maxAttempts} failed (retryable), waiting ${jittered}ms`,
      );
      await sleep(jittered);
    }
  }

  throw lastError;
}

/**
 * Run tasks with a bounded concurrency. Preserves input order in the result.
 * Use concurrency=1 for Gemini free tier to avoid 429 bursts.
 */
export async function mapWithConcurrency<I, O>(
  items: I[],
  concurrency: number,
  worker: (item: I, index: number) => Promise<O>,
): Promise<O[]> {
  const results = new Array<O>(items.length);
  let cursor = 0;

  const limit = Math.max(1, Math.min(concurrency, items.length || 1));

  async function run(): Promise<void> {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await worker(items[index], index);
    }
  }

  await Promise.all(Array.from({ length: limit }, () => run()));

  return results;
}
