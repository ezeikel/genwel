'use server';

import { categorizeUserTransactions } from '@genwel/banking/categorize';
import { db, SpendingCategory } from '@genwel/db';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { generateBudgetSuggestions } from '@/lib/ai/budget-suggestions';
import { generateSpendingInsights } from '@/lib/ai/insights';
import { effectiveCategory } from '@/lib/budget-utils';

/**
 * Categorize uncategorized transactions using AI (explicit user trigger).
 * Delegates to the shared lib util (merchant-key cache + retry/backoff).
 */
export async function categorizeTransactions(options?: {
  maxAiBatches?: number;
}) {
  const session = await auth();
  if (!session?.user?.id) return { error: 'Unauthorized' };

  const result = await categorizeUserTransactions(session.user.id, {
    maxAiBatches: options?.maxAiBatches ?? 10,
  });

  revalidatePath('/dashboard/budgets');
  revalidatePath('/dashboard');

  return result;
}

/**
 * Get AI-powered budget suggestions based on 3-month spending history.
 */
export async function getAiBudgetSuggestions() {
  const session = await auth();
  if (!session?.user?.id) return { error: 'Unauthorized' };

  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  // Aggregate debits by effective category (aiCategory with TrueLayer fallback)
  // so suggestions work before AI categorization has fully caught up.
  const transactions = await db.transaction.findMany({
    where: {
      account: { connection: { userId: session.user.id } },
      amount: { lt: 0 }, // debits only
      timestamp: { gte: threeMonthsAgo },
    },
    select: { amount: true, aiCategory: true, category: true },
  });

  if (transactions.length === 0) {
    return {
      error:
        'Not enough transaction data. Connect a bank and wait for transactions to sync.',
    };
  }

  const totals = new Map<SpendingCategory, { sum: number; count: number }>();
  for (const tx of transactions) {
    const cat = effectiveCategory(tx);
    const entry = totals.get(cat) ?? { sum: 0, count: 0 };
    entry.sum += Math.abs(Number(tx.amount) || 0);
    entry.count += 1;
    totals.set(cat, entry);
  }

  const spendingData = Array.from(totals.entries()).map(([category, t]) => ({
    category,
    totalSpent: t.sum,
    transactionCount: t.count,
    monthlyAverage: t.sum / 3,
  }));

  const suggestions = await generateBudgetSuggestions(spendingData);
  return { suggestions };
}

/**
 * Generate AI spending insights. Stored with 48h expiry.
 */
export async function generateInsights() {
  const session = await auth();
  if (!session?.user?.id) return { error: 'Unauthorized' };

  // Get current and previous period spending
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

  const [currentTxns, previousTxns, budgetConfig] = await Promise.all([
    db.transaction.findMany({
      where: {
        account: { connection: { userId: session.user.id } },
        amount: { lt: 0 },
        timestamp: { gte: currentMonthStart },
      },
      select: { amount: true, aiCategory: true, category: true },
    }),
    db.transaction.findMany({
      where: {
        account: { connection: { userId: session.user.id } },
        amount: { lt: 0 },
        timestamp: { gte: previousMonthStart, lte: previousMonthEnd },
      },
      select: { amount: true, aiCategory: true, category: true },
    }),
    db.budgetConfig.findUnique({
      where: { userId: session.user.id },
      include: { budgets: true },
    }),
  ]);

  // Aggregate by effective category (aiCategory with TrueLayer fallback).
  const aggregateByCategory = (
    txns: {
      amount: unknown;
      aiCategory: SpendingCategory | null;
      category: string | null;
    }[],
  ): Map<SpendingCategory, number> => {
    const map = new Map<SpendingCategory, number>();
    for (const tx of txns) {
      const cat = effectiveCategory(tx);
      map.set(cat, (map.get(cat) || 0) + Math.abs(Number(tx.amount) || 0));
    }
    return map;
  };

  const currentMap = aggregateByCategory(currentTxns);
  const previousMap = aggregateByCategory(previousTxns);

  const budgetMap = new Map<SpendingCategory, number>();
  if (budgetConfig) {
    for (const b of budgetConfig.budgets) {
      budgetMap.set(b.category, Number(b.amount));
    }
  }

  const insights = await generateSpendingInsights({
    currentSpending: currentMap,
    previousSpending: previousMap,
    budgets: budgetMap,
  });

  // Store insights with 48h expiry
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

  // Delete old insights first
  await db.aiInsight.deleteMany({
    where: { userId: session.user.id },
  });

  // Create new insights
  for (const insight of insights) {
    await db.aiInsight.create({
      data: {
        userId: session.user.id,
        type: insight.type,
        title: insight.title,
        body: insight.body,
        metadata: insight.metadata ?? undefined,
        expiresAt,
      },
    });
  }

  revalidatePath('/dashboard/insights');
  return { count: insights.length };
}

/** Why the insights list is empty, so the UI can show the right message. */
export type InsightsEmptyReason =
  | 'no_accounts' // user hasn't connected any bank
  | 'no_recent_activity' // accounts exist but nothing to compare this month
  | 'generation_failed' // the AI call errored
  | null; // insights present, or generated fine

export async function getInsights() {
  const session = await auth();
  if (!session?.user?.id) return { error: 'Unauthorized' as const };
  const userId = session.user.id;

  const mapRows = (rows: Awaited<ReturnType<typeof fetchInsights>>) =>
    rows.map((i) => ({
      id: i.id,
      type: i.type,
      title: i.title,
      body: i.body,
      metadata: i.metadata as Record<string, unknown> | null,
      read: i.read,
      createdAt: i.createdAt,
    }));

  async function fetchInsights() {
    return db.aiInsight.findMany({
      where: { userId, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });
  }

  let insights = await fetchInsights();
  if (insights.length > 0) {
    return {
      insights: mapRows(insights),
      emptyReason: null as InsightsEmptyReason,
    };
  }

  // None stored — work out whether we CAN generate, and why not if we can't.
  const accountCount = await db.bankAccount.count({
    where: { connection: { userId } },
  });
  if (accountCount === 0) {
    return { insights: [], emptyReason: 'no_accounts' as InsightsEmptyReason };
  }

  // Is there any spend in the current month to base insights on?
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

  // We have data — try to generate. Surface a reason if it errors.
  try {
    await generateInsights();
    insights = await fetchInsights();
    return {
      insights: mapRows(insights),
      emptyReason: (insights.length === 0
        ? 'no_recent_activity'
        : null) as InsightsEmptyReason,
    };
  } catch {
    return {
      insights: [],
      emptyReason: 'generation_failed' as InsightsEmptyReason,
    };
  }
}

/**
 * Mark an insight as read.
 */
export async function markInsightRead(insightId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: 'Unauthorized' };

  await db.aiInsight.updateMany({
    where: { id: insightId, userId: session.user.id },
    data: { read: true },
  });

  return { success: true };
}
