import type { SpendingCategory } from '@genwel/db';
import { db } from '@genwel/db';
import { getInsights } from '@/actions/ai-budgets';
import { auth } from '@/auth';
import GenerateInsightsButton from '@/components/dashboard/insights/GenerateInsightsButton';
import InsightsEmptyState from '@/components/dashboard/insights/InsightsEmptyState';
import InsightsList from '@/components/dashboard/insights/InsightsList';
import InsightsProLocked from '@/components/dashboard/insights/InsightsProLocked';
import SpendingTrendChart from '@/components/dashboard/insights/SpendingTrendChart';
import { formatCategoryName } from '@/lib/budget-utils';
import { getEntitlementsForUser } from '@/lib/entitlements';

export default async function InsightsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const entitlements = await getEntitlementsForUser(session.user.id);
  const canUseInsights = entitlements.features.aiInsights;

  // The spending chart is a "see your money" feature — free for everyone.
  const trendData = await buildTrendData(session.user.id);

  // AI insights themselves are Pro-gated. Only fetch/generate when unlocked.
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

async function buildTrendData(userId: string) {
  const now = new Date();
  const months: { label: string; start: Date; end: Date }[] = [];

  for (let i = 5; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(
      now.getFullYear(),
      now.getMonth() - i + 1,
      0,
      23,
      59,
      59,
      999,
    );
    const label = start.toLocaleDateString('en-GB', { month: 'short' });
    months.push({ label, start, end });
  }

  const data = [];

  for (const month of months) {
    const spending = await db.transaction.groupBy({
      by: ['aiCategory'],
      where: {
        account: { connection: { userId } },
        aiCategory: { not: null },
        amount: { lt: 0 },
        timestamp: { gte: month.start, lte: month.end },
      },
      _sum: { amount: true },
    });

    const entry: {
      month: string;
      total: number;
      [category: string]: string | number;
    } = { month: month.label, total: 0 };
    let total = 0;
    for (const s of spending) {
      if (s.aiCategory) {
        const val = Math.abs(Number(s._sum.amount) || 0);
        entry[formatCategoryName(s.aiCategory as SpendingCategory)] = val;
        total += val;
      }
    }
    entry.total = total;
    data.push(entry);
  }

  return data;
}
