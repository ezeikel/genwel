'use server';

import { db } from '@genwel/db';
import { getBudgetProgress } from '@/actions/budgets';
import { auth } from '@/auth';
import {
  detectFixableProblems,
  type FixableProblem,
} from '@/lib/banking/fixable-problems';
import { getEntitlementsForUser } from '@/lib/entitlements';
import { buildSubscriptionReport, type TxnLike } from '@/lib/subscriptions';

/**
 * The Genwel wedge: ranked "fixable problems" (duplicate/overlapping subs, price
 * increases, over-budget categories). Recurring detection is the single engine
 * in lib/subscriptions.ts; this derives problems from its report.
 *
 * Gated per the pricing model: FREE users get a one-problem teaser (with
 * `locked` set so the UI can prompt an upgrade); PRO users get the full ranked
 * list.
 */
export async function getFixableProblems(): Promise<{
  problems: FixableProblem[];
  totalSaving: number;
  locked: boolean; // true = free tier, more problems available on Pro
  lockedCount: number; // how many more are hidden behind Pro
  error?: string;
}> {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      problems: [],
      totalSaving: 0,
      locked: false,
      lockedCount: 0,
      error: 'Unauthorized',
    };
  }

  const since = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
  const rows = await db.transaction.findMany({
    where: {
      account: { connection: { userId: session.user.id } },
      timestamp: { gte: since },
    },
    select: {
      amount: true,
      description: true,
      merchantName: true,
      aiCategory: true,
      category: true,
      timestamp: true,
    },
  });

  const txns: TxnLike[] = rows.map((r) => ({
    amount: Number(r.amount),
    description: r.description,
    merchantName: r.merchantName,
    aiCategory: r.aiCategory,
    category: r.category,
    timestamp: r.timestamp,
  }));

  const report = buildSubscriptionReport(txns);

  const budget = await getBudgetProgress();
  const overBudget =
    'progress' in budget && budget.progress
      ? budget.progress
          .filter((p) => p.status === 'over_budget')
          .map((p) => ({
            category: p.category as string,
            overspend: p.spent - p.budgetAmount,
          }))
      : [];

  const all = detectFixableProblems({ report, overBudget });

  // FREE tier: show only the top problem as a teaser; PRO: show them all.
  const entitlements = await getEntitlementsForUser(session.user.id);
  const isPro = entitlements.features.fullFixableProblems;

  const problems = isPro ? all : all.slice(0, 1);
  const totalSaving = problems.reduce((sum, p) => sum + p.estimatedSaving, 0);

  return {
    problems,
    totalSaving,
    locked: !isPro && all.length > 1,
    lockedCount: isPro ? 0 : Math.max(0, all.length - 1),
  };
}
