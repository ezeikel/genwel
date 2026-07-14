import { faLightbulb, faLock } from '@fortawesome/pro-duotone-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { unstable_cache } from 'next/cache';
import Link from 'next/link';
import AiGuidanceDisclaimer from '@/components/dashboard/AiGuidanceDisclaimer';
import { generateSubscriptionsInsight } from '@/lib/ai/subscriptions-insight';
import { getEntitlementsForUser } from '@/lib/entitlements';
import type { SubscriptionReport } from '@/lib/subscriptions';

/**
 * AI "what to cut" strip for subscriptions. Pro-gated: free users see a locked
 * teaser, Pro users get the model's single best money-saving observation.
 * Cached per user + coarse total so it doesn't re-generate on every load.
 */

const cachedInsight = unstable_cache(
  async (_key: string, report: SubscriptionReport) =>
    generateSubscriptionsInsight(report),
  ['subscriptions-insight'],
  { revalidate: 60 * 60 * 6 },
);

export default async function SubscriptionsInsight({
  userId,
  report,
}: {
  userId: string;
  report: SubscriptionReport;
}) {
  const entitlements = await getEntitlementsForUser(userId);

  if (!entitlements.features.aiInsights) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <FontAwesomeIcon icon={faLock} className="h-4 w-4" />
        </span>
        <p className="flex-1 text-sm text-muted-foreground">
          Get a plain-English “what to cut” summary of your subscriptions with
          Pro.
        </p>
        <Link
          href="/pricing"
          className="shrink-0 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Upgrade
        </Link>
      </div>
    );
  }

  // Cache key: userId + rounded monthly total + subscription count.
  const key = `${userId}:${Math.round(report.monthlyTotal / 5) * 5}:${report.subscriptions.length}`;
  let insight: Awaited<ReturnType<typeof generateSubscriptionsInsight>> = null;
  try {
    insight = await cachedInsight(key, report);
  } catch {
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
