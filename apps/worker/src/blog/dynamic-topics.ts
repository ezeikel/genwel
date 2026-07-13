import { models } from '@genwel/banking/models';
import { generateText, Output } from 'ai';
import { z } from 'zod/v3';
import { BLOG_TOPICS } from './prompts.js';

/**
 * The "never runs dry" guarantee.
 *
 * The fixed BLOG_TOPICS seed list is finite, so once daily generation exhausts
 * it (or nearly), this asks the model to PROPOSE a fresh batch of UK personal
 * finance topics that are NOT already covered. Deduped against both the
 * already-covered set (existing posts, tracked via generationMeta.prompt) and
 * the fixed seed topics, so it never resurfaces a topic. This is what lets
 * Genwel post daily forever.
 *
 * Kept in-memory (no Sanity backlog doc needed): we generate candidates on
 * demand, filter, and return the novel ones. Cheap, schema-free, and the
 * idempotency anchor stays the same topic string (stored as
 * generationMeta.prompt on each post).
 */

// The fixed seed topics as a Set, for dedup against the never-dry generator.
export function seedTopics(): Set<string> {
  return new Set(BLOG_TOPICS);
}

const dynamicTopicSchema = z.object({
  topics: z
    .array(
      z
        .string()
        .describe(
          'A full, human-readable blog post topic/title (not a slug). Long-tail, specific, UK-focused. No trailing punctuation.',
        ),
    )
    .min(1),
});

const DYNAMIC_SYSTEM = `You are the content strategist for Genwel, a UK-focused personal finance and budgeting app. Its core audience: people supporting family (including sending money home), hustlers with irregular or multiple incomes, and those rebuilding after debt.

Propose fresh, genuinely useful, SEO-relevant blog topics for UK residents who want to manage money better.

Rules:
- Topics must be EDUCATIONAL and utility-first (budgeting, saving, debt recovery, everyday money management, understanding UK systems like ISAs, HMRC, Universal Credit). This is general financial information, NEVER regulated financial advice.
- Each topic must be DISTINCT from the ones already covered (given below). No near-duplicates, no rephrasings of covered topics.
- Prefer specific, long-tail, question-shaped angles people actually search ("how to budget when you get paid weekly", "what happens to your ISA if you move abroad", "how to split bills fairly in a house share") over broad generic titles.
- Stay on-domain: UK personal finance, budgeting, saving, debt, bills, income, and money mindset. No unrelated topics.
- Use British English and reference UK-specific context where relevant.
- Return each topic as a full human-readable title in the same style as existing Genwel topics (e.g. "How to budget on irregular income from side hustles"), NOT as a slug. Do not use em dashes.`;

/**
 * Ask the model for a batch of novel topics, filter out anything already
 * covered or in the fixed seed list, and return the fresh ones as topic strings
 * (same shape as BLOG_TOPICS entries).
 *
 * @param covered  Set of topic strings already used (generationMeta.prompt).
 * @param seed     Set of fixed BLOG_TOPICS strings.
 * @param count    How many candidates to request.
 */
export async function generateDynamicTopics(
  covered: Set<string>,
  seed: Set<string>,
  count = 8,
): Promise<string[]> {
  const excluded = [...new Set([...covered, ...seed])];
  const excludedList =
    excluded.length > 0
      ? excluded.map((t) => `- ${t}`).join('\n')
      : '(none yet)';

  const { output } = await generateText({
    model: models.text,
    system: DYNAMIC_SYSTEM,
    prompt: `Already-covered topics (DO NOT repeat or rephrase these):\n${excludedList}\n\nPropose ${count} NEW distinct Genwel blog topics.`,
    output: Output.object({ schema: dynamicTopicSchema }),
  });

  if (!output) return [];

  // Belt-and-braces: filter again in case the model repeated one. Match
  // case-insensitively against the excluded set so a re-cased duplicate is
  // still dropped, but return the model's original casing.
  const seen = new Set(excluded.map((t) => t.trim().toLowerCase()));
  const fresh: string[] = [];
  for (const raw of output.topics) {
    const topic = raw.trim();
    const key = topic.toLowerCase();
    if (!topic || seen.has(key)) continue;
    seen.add(key);
    fresh.push(topic);
  }
  return fresh;
}
