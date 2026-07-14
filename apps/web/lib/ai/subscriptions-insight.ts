import { models } from '@genwel/banking/models';
import { withRetry } from '@genwel/banking/retry-utils';
import { generateObject } from 'ai';
import { z } from 'zod/v3';
import type { SubscriptionReport } from '@/lib/subscriptions';

/**
 * The AI "what to cut" layer for subscriptions. Deterministic detection already
 * found the recurring payments, totals, duplicates and price rises; this reads
 * that structured report and writes the one or two most useful money-saving
 * observations in plain English.
 */

const schema = z.object({
  headline: z.string().describe('Short status line, max 8 words. No emoji.'),
  body: z
    .string()
    .describe(
      'One or two plain sentences on the single best money-saving move across their subscriptions. Specific, British English.',
    ),
});

export type SubscriptionsInsight = z.infer<typeof schema>;

export async function generateSubscriptionsInsight(
  report: SubscriptionReport,
): Promise<SubscriptionsInsight | null> {
  if (report.subscriptions.length === 0) return null;

  const gbp = (n: number) => `£${n.toFixed(2)}`;
  const lines = report.subscriptions
    .slice(0, 20)
    .map(
      (s) =>
        `- ${s.name}: ${gbp(s.amount)} ${s.cadence}${s.priceRise ? ` (up ${gbp(s.priceRise.delta)})` : ''}`,
    )
    .join('\n');
  const dupes = report.duplicates
    .map(
      (d) =>
        `- ${d.subscriptions.length} ${d.label} (${d.subscriptions.map((s) => s.name).join(', ')}), could save ${gbp(d.potentialMonthlySaving)}/mo`,
    )
    .join('\n');

  const { object } = await withRetry(
    () =>
      generateObject({
        model: models.intelligent,
        schema,
        prompt: `You are a calm, plain-spoken UK money assistant. The user's recurring payments have already been detected. In ONE short paragraph, tell them the single most useful money-saving move — the biggest overlap to cut, a notable price rise, or the biggest recurring cost worth reviewing. Pick ONE thing.

Monthly total across all subscriptions: ${gbp(report.monthlyTotal)} (${gbp(report.yearlyTotal)}/year).

Subscriptions:
${lines}

${dupes ? `Overlapping services:\n${dupes}` : 'No obvious overlaps.'}

Rules:
- British English (£).
- Be specific with names and amounts.
- Supportive, never preachy or alarmist.
- General information, NOT regulated financial advice.
- No emoji, no exclamation marks.`,
      }),
    { maxAttempts: 3, label: 'subscriptions-insight' },
  );

  return object ?? null;
}
