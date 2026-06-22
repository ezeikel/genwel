import type { SpendingCategory } from '@genwel/db';
import { db } from '@genwel/db';
import { getInsights } from '@/actions/ai-budgets';
import { auth } from '@/auth';
import GenerateInsightsButton from '@/components/dashboard/insights/GenerateInsightsButton';
import InsightsEmptyState from '@/components/dashboard/insights/InsightsEmptyState';
import InsightsList from '@/components/dashboard/insights/InsightsList';
import SpendingTrendChart from '@/components/dashboard/insights/SpendingTrendChart';
import { formatCategoryName } from '@/lib/budget-utils';

export default async function InsightsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const result = await getInsights();

  // Build 3-month trend data for chart
  const trendData = await buildTrendData(session.user.id);

  if ('error' in result) return null;

  const { insights } = result;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Insights</h1>
        <GenerateInsightsButton />
      </div>

      {trendData.length > 0 && (
        <div className="mb-8">
          <SpendingTrendChart data={trendData} />
        </div>
      )}

      {insights.length === 0 ? (
        <InsightsEmptyState />
      ) : (
        <InsightsList insights={insights} />
      )}
    </div>
  );
}

async function buildTrendData(userId: string) {
  const now = new Date();
  const months: { label: string; start: Date; end: Date }[] = [];

  for (let i = 2; i >= 0; i--) {
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
