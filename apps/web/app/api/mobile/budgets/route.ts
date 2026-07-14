import { SpendingCategory } from '@genwel/db';
import { z } from 'zod';
import {
  getBudgetConfigForUser,
  getBudgetProgressForUser,
  setBudgetsForUser,
  upsertBudgetConfigForUser,
} from '@/lib/budget-data';
import { getEntitlementsForUser } from '@/lib/entitlements';
import {
  getMobileUserId,
  mobileError,
  mobileJson,
  mobileOptions,
} from '@/lib/mobile-api';

const budgetSchema = z.object({
  periodType: z.enum(['CALENDAR_MONTH', 'PAYDAY']),
  paydayDate: z.number().int().min(1).max(31).nullable().optional(),
  budgets: z.array(
    z.object({
      category: z.nativeEnum(SpendingCategory),
      amount: z.number().positive().max(1_000_000),
    }),
  ),
});

export const dynamic = 'force-dynamic';

export async function GET() {
  const userId = await getMobileUserId();
  if (!userId) return mobileError('Unauthorized', 401);

  const entitlements = await getEntitlementsForUser(userId);
  if (!entitlements.features.budgets) {
    return mobileJson({
      config: null,
      progress: { progress: [], totalBudgeted: 0, totalSpent: 0 },
      entitlements,
    });
  }
  const [config, progress] = await Promise.all([
    getBudgetConfigForUser(userId),
    getBudgetProgressForUser(userId),
  ]);
  return mobileJson({ config, progress, entitlements });
}

export async function PUT(request: Request) {
  const userId = await getMobileUserId();
  if (!userId) return mobileError('Unauthorized', 401);

  const entitlements = await getEntitlementsForUser(userId);
  if (!entitlements.features.budgets) {
    return mobileError('Budgets are a Pro feature', 403);
  }

  const parsed = budgetSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return mobileError('Invalid budget', 400);

  const config = await upsertBudgetConfigForUser(userId, parsed.data);
  if ('error' in config && config.error) return mobileError(config.error, 400);
  const result = await setBudgetsForUser(userId, parsed.data.budgets);
  if ('error' in result && result.error) return mobileError(result.error, 400);

  return mobileJson({
    config: await getBudgetConfigForUser(userId),
    progress: await getBudgetProgressForUser(userId),
  });
}

export const OPTIONS = () => mobileOptions('GET, PUT');
