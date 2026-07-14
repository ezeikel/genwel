import { type BudgetPeriodType, db, type SpendingCategory } from '@genwel/db';
import { effectiveCategory, getCurrentPeriod } from '@/lib/budget-utils';

export interface BudgetProgressItem {
  category: SpendingCategory;
  budgetAmount: number;
  spent: number;
  remaining: number;
  percentUsed: number;
  status: 'on_track' | 'warning' | 'over_budget';
}

export async function getBudgetConfigForUser(userId: string) {
  const config = await db.budgetConfig.findUnique({
    where: { userId },
    include: { budgets: true },
  });

  if (!config) return null;

  return {
    id: config.id,
    periodType: config.periodType,
    paydayDate: config.paydayDate,
    budgets: config.budgets.map((budget) => ({
      id: budget.id,
      category: budget.category,
      amount: budget.amount.toString(),
    })),
  };
}

export async function upsertBudgetConfigForUser(
  userId: string,
  data: { periodType: BudgetPeriodType; paydayDate?: number | null },
) {
  const { periodType, paydayDate } = data;
  if (
    periodType === 'PAYDAY' &&
    (!paydayDate || paydayDate < 1 || paydayDate > 31)
  ) {
    return { error: 'Payday date must be between 1 and 31' } as const;
  }

  const config = await db.budgetConfig.upsert({
    where: { userId },
    create: {
      userId,
      periodType,
      paydayDate: periodType === 'PAYDAY' ? paydayDate : null,
    },
    update: {
      periodType,
      paydayDate: periodType === 'PAYDAY' ? paydayDate : null,
    },
  });

  return {
    config: {
      id: config.id,
      periodType: config.periodType,
      paydayDate: config.paydayDate,
    },
  };
}

export async function setBudgetsForUser(
  userId: string,
  budgets: { category: SpendingCategory; amount: number }[],
) {
  const config = await db.budgetConfig.findUnique({ where: { userId } });
  if (!config) {
    return { error: 'Create a budget configuration first' } as const;
  }

  const validBudgets = budgets.filter(
    ({ amount }) => Number.isFinite(amount) && amount > 0,
  );
  await db.$transaction([
    db.budget.deleteMany({
      where: {
        configId: config.id,
        category: { notIn: validBudgets.map(({ category }) => category) },
      },
    }),
    ...validBudgets.map(({ category, amount }) =>
      db.budget.upsert({
        where: { configId_category: { configId: config.id, category } },
        create: { configId: config.id, category, amount },
        update: { amount },
      }),
    ),
  ]);

  return { success: true } as const;
}

export async function deleteBudgetForUser(
  userId: string,
  category: SpendingCategory,
) {
  const config = await db.budgetConfig.findUnique({ where: { userId } });
  if (!config) return { error: 'No budget configuration found' } as const;

  try {
    await db.budget.delete({
      where: { configId_category: { configId: config.id, category } },
    });
  } catch {
    return { error: 'Budget not found' } as const;
  }

  return { success: true } as const;
}

/** Current-period progress, shared by web, mobile, and fixable-problem logic. */
export async function getBudgetProgressForUser(userId: string) {
  const config = await db.budgetConfig.findUnique({
    where: { userId },
    include: { budgets: true },
  });

  if (!config || config.budgets.length === 0) {
    return { progress: [], totalBudgeted: 0, totalSpent: 0 };
  }

  const { start, end } = getCurrentPeriod(config.periodType, config.paydayDate);
  const transactions = await db.transaction.findMany({
    where: {
      account: { connection: { userId } },
      timestamp: { gte: start, lte: end },
      amount: { lt: 0 },
    },
    select: { amount: true, aiCategory: true, category: true },
  });

  const spendingMap = new Map<SpendingCategory, number>();
  for (const transaction of transactions) {
    const category = effectiveCategory(transaction);
    spendingMap.set(
      category,
      (spendingMap.get(category) ?? 0) +
        Math.abs(Number(transaction.amount) || 0),
    );
  }

  let totalBudgeted = 0;
  let totalSpent = 0;
  const progress: BudgetProgressItem[] = config.budgets.map((budget) => {
    const budgetAmount = Number(budget.amount);
    const spent = spendingMap.get(budget.category) ?? 0;
    const remaining = Math.max(budgetAmount - spent, 0);
    const percentUsed = budgetAmount > 0 ? (spent / budgetAmount) * 100 : 0;
    const status =
      percentUsed > 100
        ? ('over_budget' as const)
        : percentUsed >= 75
          ? ('warning' as const)
          : ('on_track' as const);

    totalBudgeted += budgetAmount;
    totalSpent += spent;

    return {
      category: budget.category,
      budgetAmount,
      spent,
      remaining,
      percentUsed,
      status,
    };
  });

  const statusOrder = { over_budget: 0, warning: 1, on_track: 2 };
  progress.sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);

  return {
    progress,
    totalBudgeted,
    totalSpent,
    periodStart: start,
    periodEnd: end,
  };
}
