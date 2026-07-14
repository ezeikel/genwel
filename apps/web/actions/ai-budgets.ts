'use server';

import { categorizeUserTransactions } from '@genwel/banking/categorize';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import {
  generateInsightsForUser,
  getBudgetSuggestionsForUser,
  getInsightsForUser,
  markInsightReadForUser,
} from '@/lib/insights-data';

export type { InsightsEmptyReason } from '@/lib/insights-data';

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

export async function getAiBudgetSuggestions() {
  const session = await auth();
  if (!session?.user?.id) return { error: 'Unauthorized' as const };
  return getBudgetSuggestionsForUser(session.user.id);
}

export async function generateInsights() {
  const session = await auth();
  if (!session?.user?.id) return { error: 'Unauthorized' as const };
  const result = await generateInsightsForUser(session.user.id);
  revalidatePath('/dashboard/insights');
  return result;
}

export async function getInsights() {
  const session = await auth();
  if (!session?.user?.id) return { error: 'Unauthorized' as const };
  return getInsightsForUser(session.user.id);
}

export async function markInsightRead(insightId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: 'Unauthorized' as const };
  return markInsightReadForUser(session.user.id, insightId);
}
