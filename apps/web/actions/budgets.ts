'use server';

import type { BudgetPeriodType, SpendingCategory } from '@genwel/db';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import {
  deleteBudgetForUser,
  getBudgetConfigForUser,
  getBudgetProgressForUser,
  setBudgetsForUser,
  upsertBudgetConfigForUser,
} from '@/lib/budget-data';

export type { BudgetProgressItem } from '@/lib/budget-data';

const currentUserId = async () => (await auth())?.user?.id ?? null;

export async function getBudgetConfig() {
  const userId = await currentUserId();
  if (!userId) return { error: 'Unauthorized' as const };
  return { config: await getBudgetConfigForUser(userId) };
}

export async function createOrUpdateBudgetConfig(data: {
  periodType: BudgetPeriodType;
  paydayDate?: number | null;
}) {
  const userId = await currentUserId();
  if (!userId) return { error: 'Unauthorized' as const };

  const result = await upsertBudgetConfigForUser(userId, data);
  if (!('error' in result)) revalidatePath('/dashboard/budgets');
  return result;
}

export async function setBudgets(data: {
  budgets: { category: SpendingCategory; amount: number }[];
}) {
  const userId = await currentUserId();
  if (!userId) return { error: 'Unauthorized' as const };

  const result = await setBudgetsForUser(userId, data.budgets);
  if (!('error' in result)) {
    revalidatePath('/dashboard/budgets');
    revalidatePath('/dashboard');
  }
  return result;
}

export async function deleteBudget(category: SpendingCategory) {
  const userId = await currentUserId();
  if (!userId) return { error: 'Unauthorized' as const };

  const result = await deleteBudgetForUser(userId, category);
  if (!('error' in result)) {
    revalidatePath('/dashboard/budgets');
    revalidatePath('/dashboard');
  }
  return result;
}

export async function getBudgetProgress() {
  const userId = await currentUserId();
  if (!userId) return { error: 'Unauthorized' as const };
  return getBudgetProgressForUser(userId);
}
