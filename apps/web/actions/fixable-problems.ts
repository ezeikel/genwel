'use server';

import { db } from '@genwel/db';
import { getBudgetProgress } from '@/actions/budgets';
import { auth } from '@/auth';
import {
  detectFixableProblems,
  type FixableProblem,
  type TxnInput,
} from '@/lib/banking/fixable-problems';

/**
 * Compute the user's ranked "fixable problems" (the Genwel wedge): duplicate/
 * overlapping subscriptions, price increases, and over-budget categories.
 * Pure heuristic — no AI. Looks at ~180 days of transactions for recurrence.
 */
export async function getFixableProblems(): Promise<{
  problems: FixableProblem[];
  totalSaving: number;
  error?: string;
}> {
  const session = await auth();
  if (!session?.user?.id) {
    return { problems: [], totalSaving: 0, error: 'Unauthorized' };
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

  const txns: TxnInput[] = rows.map((r) => ({
    amount: Number(r.amount),
    description: r.description,
    merchantName: r.merchantName,
    aiCategory: r.aiCategory,
    category: r.category,
    timestamp: r.timestamp,
  }));

  // Pull over-budget categories from the existing budget-progress calc.
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

  const problems = detectFixableProblems({ txns, overBudget });
  const totalSaving = problems.reduce((sum, p) => sum + p.estimatedSaving, 0);

  return { problems, totalSaving };
}
