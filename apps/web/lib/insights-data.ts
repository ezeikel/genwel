import { db, type SpendingCategory } from '@genwel/db';
import { generateBudgetSuggestions } from '@/lib/ai/budget-suggestions';
import { generateSpendingInsights } from '@/lib/ai/insights';
import { effectiveCategory, formatCategoryName } from '@/lib/budget-utils';

export type InsightsEmptyReason =
  | 'no_accounts'
  | 'no_recent_activity'
  | 'generation_failed'
  | null;

export async function getBudgetSuggestionsForUser(userId: string) {
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  const transactions = await db.transaction.findMany({
    where: {
      account: { connection: { userId } },
      amount: { lt: 0 },
      timestamp: { gte: threeMonthsAgo },
    },
    select: { amount: true, aiCategory: true, category: true },
  });
  if (transactions.length === 0) {
    return {
      error:
        'Not enough transaction data. Connect a bank and wait for transactions to sync.',
    } as const;
  }

  const totals = new Map<SpendingCategory, { sum: number; count: number }>();
  for (const transaction of transactions) {
    const category = effectiveCategory(transaction);
    const entry = totals.get(category) ?? { sum: 0, count: 0 };
    entry.sum += Math.abs(Number(transaction.amount) || 0);
    entry.count += 1;
    totals.set(category, entry);
  }

  const spendingData = [...totals.entries()].map(([category, total]) => ({
    category,
    totalSpent: total.sum,
    transactionCount: total.count,
    monthlyAverage: total.sum / 3,
  }));
  return { suggestions: await generateBudgetSuggestions(spendingData) };
}

export async function generateInsightsForUser(userId: string) {
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const previousMonthEnd = new Date(
    now.getFullYear(),
    now.getMonth(),
    0,
    23,
    59,
    59,
    999,
  );

  const [currentTransactions, previousTransactions, budgetConfig] =
    await Promise.all([
      db.transaction.findMany({
        where: {
          account: { connection: { userId } },
          amount: { lt: 0 },
          timestamp: { gte: currentMonthStart },
        },
        select: { amount: true, aiCategory: true, category: true },
      }),
      db.transaction.findMany({
        where: {
          account: { connection: { userId } },
          amount: { lt: 0 },
          timestamp: { gte: previousMonthStart, lte: previousMonthEnd },
        },
        select: { amount: true, aiCategory: true, category: true },
      }),
      db.budgetConfig.findUnique({
        where: { userId },
        include: { budgets: true },
      }),
    ]);

  const aggregate = (
    transactions: {
      amount: unknown;
      aiCategory: SpendingCategory | null;
      category: string | null;
    }[],
  ) => {
    const totals = new Map<SpendingCategory, number>();
    for (const transaction of transactions) {
      const category = effectiveCategory(transaction);
      totals.set(
        category,
        (totals.get(category) ?? 0) + Math.abs(Number(transaction.amount) || 0),
      );
    }
    return totals;
  };

  const budgets = new Map<SpendingCategory, number>();
  for (const budget of budgetConfig?.budgets ?? []) {
    budgets.set(budget.category, Number(budget.amount));
  }

  const insights = await generateSpendingInsights({
    currentSpending: aggregate(currentTransactions),
    previousSpending: aggregate(previousTransactions),
    budgets,
  });
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

  await db.$transaction(async (tx) => {
    await tx.aiInsight.deleteMany({ where: { userId } });
    for (const insight of insights) {
      await tx.aiInsight.create({
        data: {
          userId,
          type: insight.type,
          title: insight.title,
          body: insight.body,
          metadata: insight.metadata ?? undefined,
          expiresAt,
        },
      });
    }
  });

  return { count: insights.length };
}

const fetchInsightsForUser = (userId: string) =>
  db.aiInsight.findMany({
    where: { userId, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
  });

const mapInsights = (rows: Awaited<ReturnType<typeof fetchInsightsForUser>>) =>
  rows.map((insight) => ({
    id: insight.id,
    type: insight.type,
    title: insight.title,
    body: insight.body,
    metadata: insight.metadata as Record<string, unknown> | null,
    read: insight.read,
    createdAt: insight.createdAt,
  }));

export async function getInsightsForUser(
  userId: string,
  options: { generateIfMissing?: boolean } = {},
) {
  let insights = await fetchInsightsForUser(userId);
  if (insights.length > 0) {
    return { insights: mapInsights(insights), emptyReason: null };
  }

  const accountCount = await db.bankAccount.count({
    where: { connection: { userId } },
  });
  if (accountCount === 0) {
    return {
      insights: [],
      emptyReason: 'no_accounts' as InsightsEmptyReason,
    };
  }

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const recentSpend = await db.transaction.count({
    where: {
      account: { connection: { userId } },
      amount: { lt: 0 },
      timestamp: { gte: monthStart },
    },
  });
  if (recentSpend === 0) {
    return {
      insights: [],
      emptyReason: 'no_recent_activity' as InsightsEmptyReason,
    };
  }

  if (options.generateIfMissing === false) {
    return { insights: [], emptyReason: null };
  }

  try {
    await generateInsightsForUser(userId);
    insights = await fetchInsightsForUser(userId);
    return {
      insights: mapInsights(insights),
      emptyReason: (insights.length === 0
        ? 'no_recent_activity'
        : null) as InsightsEmptyReason,
    };
  } catch (error) {
    console.error('[Insights] Generation failed:', error);
    return {
      insights: [],
      emptyReason: 'generation_failed' as InsightsEmptyReason,
    };
  }
}

export async function markInsightReadForUser(
  userId: string,
  insightId: string,
) {
  await db.aiInsight.updateMany({
    where: { id: insightId, userId },
    data: { read: true },
  });
  return { success: true } as const;
}

/** Six monthly totals used by the web and native spending charts. */
export async function getSpendingTrendForUser(userId: string) {
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, index) => {
    const offset = 5 - index;
    const start = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    const end = new Date(
      now.getFullYear(),
      now.getMonth() - offset + 1,
      0,
      23,
      59,
      59,
      999,
    );
    return {
      label: start.toLocaleDateString('en-GB', { month: 'short' }),
      start,
      end,
    };
  });

  return Promise.all(
    months.map(async (month) => {
      const rows = await db.transaction.findMany({
        where: {
          account: { connection: { userId } },
          amount: { lt: 0 },
          timestamp: { gte: month.start, lte: month.end },
        },
        select: { amount: true, aiCategory: true, category: true },
      });
      const entry: Record<string, string | number> & {
        month: string;
        total: number;
      } = { month: month.label, total: 0 };
      for (const row of rows) {
        const category = formatCategoryName(effectiveCategory(row));
        const amount = Math.abs(Number(row.amount) || 0);
        entry[category] = Number(entry[category] ?? 0) + amount;
        entry.total += amount;
      }
      return entry;
    }),
  );
}
