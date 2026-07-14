import { getInsights } from '@/actions/ai-budgets';
import { auth } from '@/auth';
import GenerateInsightsButton from '@/components/dashboard/insights/GenerateInsightsButton';
import InsightsEmptyState from '@/components/dashboard/insights/InsightsEmptyState';
import InsightsList from '@/components/dashboard/insights/InsightsList';
import InsightsProLocked from '@/components/dashboard/insights/InsightsProLocked';
import SpendingTrendChart from '@/components/dashboard/insights/SpendingTrendChart';
import { getEntitlementsForUser } from '@/lib/entitlements';
import { getSpendingTrendForUser } from '@/lib/insights-data';

export default async function InsightsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const entitlements = await getEntitlementsForUser(session.user.id);
  const canUseInsights = entitlements.features.aiInsights;

  // The spending chart is a "see your money" feature — free for everyone.
  const trendData = await getSpendingTrendForUser(session.user.id);

  // Generated insights are Pro-gated. Only fetch/generate when unlocked.
  const result = canUseInsights ? await getInsights() : null;
  const insights = result && !('error' in result) ? result.insights : [];
  const emptyReason =
    result && !('error' in result) ? result.emptyReason : null;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Insights</h1>
        {canUseInsights && <GenerateInsightsButton />}
      </div>

      {trendData.length > 0 && (
        <div className="mb-8">
          <SpendingTrendChart data={trendData} />
        </div>
      )}

      {!canUseInsights ? (
        <InsightsProLocked />
      ) : insights.length === 0 ? (
        <InsightsEmptyState reason={emptyReason} />
      ) : (
        <InsightsList insights={insights} />
      )}
    </div>
  );
}
