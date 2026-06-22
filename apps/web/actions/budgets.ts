'use server';

import { BudgetPeriodType, db, SpendingCategory } from '@genwel/db';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { effectiveCategory, getCurrentPeriod } from '@/lib/budget-utils';

/**
 * Get the current user's budget config with all budget lines.
 */
export async function getBudgetConfig() {
  const session = await auth();
  if (!session?.user?.id) return { error: 'Unauthorized' };

  const config = await db.budgetConfig.findUnique({
    where: { userId: session.user.id },
    include: { budgets: true },
  });

  if (!config) return { config: null };

  return {
    config: {
      id: config.id,
      periodType: config.periodType,
      paydayDate: config.paydayDate,
      budgets: config.budgets.map((b) => ({
        id: b.id,
        category: b.category,
        amount: b.amount.toString(),
      })),
    },
  };
}

/**
 * Create or update the user's budget configuration.
 */
export async function createOrUpdateBudgetConfig(data: {
  periodType: BudgetPeriodType;
  paydayDate?: number | null;
}) {
  const session = await auth();
  if (!session?.user?.id) return { error: 'Unauthorized' };

  const { periodType, paydayDate } = data;

  if (
    periodType === 'PAYDAY' &&
    (!paydayDate || paydayDate < 1 || paydayDate > 31)
  ) {
    return { error: 'Payday date must be between 1 and 31' };
  }

  const config = await db.budgetConfig.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      periodType,
      paydayDate: periodType === 'PAYDAY' ? paydayDate : null,
    },
    update: {
      periodType,
      paydayDate: periodType === 'PAYDAY' ? paydayDate : null,
    },
  });

  revalidatePath('/dashboard/budgets');
  return {
    config: {
      id: config.id,
      periodType: config.periodType,
      paydayDate: config.paydayDate,
    },
  };
}

/**
 * Upsert multiple budget lines at once.
 */
export async function setBudgets(data: {
  budgets: { category: SpendingCategory; amount: number }[];
}) {
  const session = await auth();
  if (!session?.user?.id) return { error: 'Unauthorized' };

  const config = await db.budgetConfig.findUnique({
    where: { userId: session.user.id },
  });

  if (!config) return { error: 'Create a budget configuration first' };

  for (const { category, amount } of data.budgets) {
    if (amount <= 0) continue;
    await db.budget.upsert({
      where: { configId_category: { configId: config.id, category } },
      create: { configId: config.id, category, amount },
      update: { amount },
    });
  }

  revalidatePath('/dashboard/budgets');
  revalidatePath('/dashboard');
  return { success: true };
}

/**
 * Delete a single budget line.
 */
export async function deleteBudget(category: SpendingCategory) {
  const session = await auth();
  if (!session?.user?.id) return { error: 'Unauthorized' };

  const config = await db.budgetConfig.findUnique({
    where: { userId: session.user.id },
  });

  if (!config) return { error: 'No budget configuration found' };

  try {
    await db.budget.delete({
      where: { configId_category: { configId: config.id, category } },
    });
  } catch {
    return { error: 'Budget not found' };
  }

  revalidatePath('/dashboard/budgets');
  revalidatePath('/dashboard');
  return { success: true };
}

export interface BudgetProgressItem {
  category: SpendingCategory;
  budgetAmount: number;
  spent: number;
  remaining: number;
  percentUsed: number;
  status: 'on_track' | 'warning' | 'over_budget';
}

/**
 * Get budget progress for the current period.
 * Aggregates transactions by aiCategory for all budgeted categories.
 */
export async function getBudgetProgress() {
  const session = await auth();
  if (!session?.user?.id) return { error: 'Unauthorized' };

  const config = await db.budgetConfig.findUnique({
    where: { userId: session.user.id },
    include: { budgets: true },
  });

  if (!config || config.budgets.length === 0) {
    return { progress: [], totalBudgeted: 0, totalSpent: 0 };
  }

  const { start, end } = getCurrentPeriod(config.periodType, config.paydayDate);

  // Fetch period debits and group by effective category (aiCategory with a
  // TrueLayer-category fallback), so budgets render before AI categorization
  // has caught up. groupBy can't compute the fallback, so we aggregate here.
  const transactions = await db.transaction.findMany({
    where: {
      account: { connection: { userId: session.user.id } },
      timestamp: { gte: start, lte: end },
      amount: { lt: 0 }, // only debits
    },
    select: { amount: true, aiCategory: true, category: true },
  });

  const spendingMap = new Map<SpendingCategory, number>();
  for (const tx of transactions) {
    const cat = effectiveCategory(tx);
    // amount is negative for debits — take absolute value
    const prev = spendingMap.get(cat) || 0;
    spendingMap.set(cat, prev + Math.abs(Number(tx.amount) || 0));
  }

  let totalBudgeted = 0;
  let totalSpent = 0;

  const progress: BudgetProgressItem[] = config.budgets.map((budget) => {
    const budgetAmount = Number(budget.amount);
    const spent = spendingMap.get(budget.category) || 0;
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

  // Sort: over_budget first, then warning, then on_track
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
