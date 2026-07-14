import { db } from '@genwel/db';
import {
  detectFixableProblems,
  type FixableProblem,
} from '@/lib/banking/fixable-problems';
import { getBudgetProgressForUser } from '@/lib/budget-data';
import { getEntitlementsForUser } from '@/lib/entitlements';
import { buildSubscriptionReport, type TxnLike } from '@/lib/subscriptions';

export type FixableProblemsResult = {
  problems: FixableProblem[];
  totalSaving: number;
  locked: boolean;
  lockedCount: number;
};

/** Ranked money-saving findings for one user, including free-tier gating. */
export async function getFixableProblemsForUser(
  userId: string,
  existingReport?: ReturnType<typeof buildSubscriptionReport>,
): Promise<FixableProblemsResult> {
  let report = existingReport;
  if (!report) {
    const since = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
    const rows = await db.transaction.findMany({
      where: {
        account: { connection: { userId } },
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

    report = buildSubscriptionReport(
      rows.map(
        (row): TxnLike => ({
          amount: Number(row.amount),
          description: row.description,
          merchantName: row.merchantName,
          aiCategory: row.aiCategory,
          category: row.category,
          timestamp: row.timestamp,
        }),
      ),
    );
  }

  const budget = await getBudgetProgressForUser(userId);
  const overBudget = budget.progress
    .filter((item) => item.status === 'over_budget')
    .map((item) => ({
      category: item.category,
      overspend: item.spent - item.budgetAmount,
    }));

  const all = detectFixableProblems({ report, overBudget });
  const entitlements = await getEntitlementsForUser(userId);
  const hasFullAccess = entitlements.features.fullFixableProblems;
  const problems = hasFullAccess ? all : all.slice(0, 1);

  return {
    problems,
    totalSaving: problems.reduce(
      (sum, problem) => sum + problem.estimatedSaving,
      0,
    ),
    locked: !hasFullAccess && all.length > 1,
    lockedCount: hasFullAccess ? 0 : Math.max(0, all.length - 1),
  };
}
