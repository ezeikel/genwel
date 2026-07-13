import { models } from '@genwel/banking/models';
import { withRetry } from '@genwel/banking/retry-utils';
import { generateObject } from 'ai';
import { z } from 'zod/v3';

/**
 * A single, human "here's where you stand" summary of the money command centre.
 * Deliberately ONE short paragraph — the overview's job is orientation, not a
 * wall of tips (that's what the Insights page is for).
 */

const overviewInsightSchema = z.object({
  headline: z
    .string()
    .describe('A short, calm status line, max 8 words. No emoji.'),
  body: z
    .string()
    .describe(
      'One or two plain sentences on the standout thing about their position right now. Specific, supportive, British English.',
    ),
});

export type OverviewInsight = z.infer<typeof overviewInsightSchema>;

export type OverviewInsightInput = {
  netWorth: number;
  cash: number;
  savings: number;
  creditDebt: number; // positive magnitude owed
  monthDelta: number | null;
  accountCount: number;
};

export async function generateOverviewInsight(
  input: OverviewInsightInput,
): Promise<OverviewInsight | null> {
  const gbp = (n: number) => `£${Math.round(n).toLocaleString('en-GB')}`;

  const { object } = await withRetry(
    () =>
      generateObject({
        model: models.intelligent,
        schema: overviewInsightSchema,
        prompt: `You are a calm, plain-spoken UK money assistant. In ONE short paragraph, tell the user the single most useful thing about where they stand right now. Do not list everything; pick the one thing that matters.

Their position:
- Net worth: ${gbp(input.netWorth)}
- Spendable cash: ${gbp(input.cash)}
- Savings: ${gbp(input.savings)}
- Credit-card debt: ${gbp(input.creditDebt)} owed
- Change this month: ${input.monthDelta === null ? 'unknown' : gbp(input.monthDelta)}
- Accounts connected: ${input.accountCount}

Rules:
- British English (£, "favourite").
- Supportive and factual, never alarmist or preachy.
- If card debt is high relative to cash, gently note it. If savings grew, acknowledge it. If nothing stands out, say things look steady.
- This is general information, NOT regulated financial advice — don't recommend specific products.
- No emoji. No exclamation marks.`,
      }),
    { maxAttempts: 3, label: 'overview-insight' },
  );

  return object ?? null;
}
