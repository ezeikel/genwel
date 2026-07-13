import { faLightbulb } from '@fortawesome/pro-duotone-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { unstable_cache } from 'next/cache';
import {
  generateOverviewInsight,
  type OverviewInsightInput,
} from '@/lib/ai/overview-insight';
import AiGuidanceDisclaimer from './AiGuidanceDisclaimer';

/**
 * The AI "here's where you stand" strip for the overview. Async server
 * component. Cached per user for 6 hours AND keyed on the rounded position, so
 * it only re-generates when the numbers move meaningfully — not on every load.
 */

// Cache the model call. Key includes userId + a coarse fingerprint of the
// position so a small balance wobble doesn't burn a fresh generation.
const cachedInsight = unstable_cache(
  async (_key: string, input: OverviewInsightInput) =>
    generateOverviewInsight(input),
  ['overview-insight'],
  { revalidate: 60 * 60 * 6 },
);

function fingerprint(userId: string, input: OverviewInsightInput): string {
  const round = (n: number) => Math.round(n / 100) * 100; // £100 buckets
  return [
    userId,
    round(input.netWorth),
    round(input.cash),
    round(input.savings),
    round(input.creditDebt),
  ].join(':');
}

export default async function OverviewInsight({
  userId,
  input,
}: {
  userId: string;
  input: OverviewInsightInput;
}) {
  let insight: Awaited<ReturnType<typeof generateOverviewInsight>> = null;
  try {
    insight = await cachedInsight(fingerprint(userId, input), input);
  } catch {
    // AI unavailable — the overview is still fully useful without it.
    return null;
  }

  if (!insight) return null;

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <FontAwesomeIcon icon={faLightbulb} className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">
            {insight.headline}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            {insight.body}
          </p>
          <div className="mt-2">
            <AiGuidanceDisclaimer />
          </div>
        </div>
      </div>
    </div>
  );
}
