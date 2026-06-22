import { db, type SpendingCategory } from '@genwel/db';
import {
  categorizeTransactionBatch,
  type TransactionForCategorization,
} from '@/lib/ai/categorization';
import { getMerchantKey } from '@/lib/banking/merchant';

const BATCH_SIZE = 20;
/** Cap AI batches per invocation so a single run stays bounded. */
const DEFAULT_MAX_AI_BATCHES = 5;

/**
 * Categorize uncategorized transactions using AI for a given user.
 *
 * Plain utility (NOT a server action) — safe to call from server components,
 * route handlers, or background jobs.
 *
 * Merchant caching keys on a derived merchant key from the description (the
 * mock bank, and many real banks, return NULL merchantName), so repeat
 * merchants are categorized for free without an AI call.
 *
 * Bounded: processes at most `maxAiBatches` AI batches per call so it can be
 * invoked incrementally (e.g. on page visit or via a background loop) without
 * blocking for minutes.
 */
export async function categorizeUserTransactions(
  userId: string,
  options?: { maxAiBatches?: number },
): Promise<{ aiCategorized: number; cached: number; remaining: number }> {
  const maxAiBatches = options?.maxAiBatches ?? DEFAULT_MAX_AI_BATCHES;

  // 1. Build merchant cache from already-categorized transactions.
  const existingCategorized = await db.transaction.findMany({
    where: {
      account: { connection: { userId } },
      aiCategory: { not: null },
    },
    select: { description: true, merchantName: true, aiCategory: true },
  });

  const merchantCache = new Map<string, SpendingCategory>();
  for (const tx of existingCategorized) {
    const key = getMerchantKey(tx.merchantName ?? tx.description);
    if (key && tx.aiCategory && !merchantCache.has(key)) {
      merchantCache.set(key, tx.aiCategory);
    }
  }

  // 2. Pull a working set of uncategorized transactions.
  const pageSize = BATCH_SIZE * maxAiBatches * 2; // room for cache hits
  const uncategorized = await db.transaction.findMany({
    where: {
      account: { connection: { userId } },
      aiCategory: null,
    },
    take: pageSize,
    orderBy: { timestamp: 'desc' },
  });

  if (uncategorized.length === 0) {
    return { aiCategorized: 0, cached: 0, remaining: 0 };
  }

  // 3. Split into cache hits vs needs-AI.
  const needsAi: TransactionForCategorization[] = [];
  const cachedUpdates: { id: string; category: SpendingCategory }[] = [];

  for (const tx of uncategorized) {
    const key = getMerchantKey(tx.merchantName ?? tx.description);
    if (key && merchantCache.has(key)) {
      cachedUpdates.push({ id: tx.id, category: merchantCache.get(key)! });
    } else {
      needsAi.push({
        id: tx.id,
        merchantName: tx.merchantName,
        description: tx.description,
        category: tx.category,
        amount: Number(tx.amount),
      });
    }
  }

  // 4. Apply cached categories.
  for (const { id, category } of cachedUpdates) {
    await db.transaction.update({
      where: { id },
      data: { aiCategory: category },
    });
  }

  // 5. AI-categorize up to maxAiBatches batches. As we learn categories,
  //    feed them back into the cache so later batches benefit.
  let aiCategorized = 0;
  const batchesToRun = Math.min(
    Math.ceil(needsAi.length / BATCH_SIZE),
    maxAiBatches,
  );

  for (let b = 0; b < batchesToRun; b += 1) {
    const batch = needsAi.slice(b * BATCH_SIZE, (b + 1) * BATCH_SIZE);
    if (batch.length === 0) break;

    try {
      const results = await categorizeTransactionBatch(batch);
      for (const tx of batch) {
        const category = results.get(tx.id);
        if (!category) continue;
        await db.transaction.update({
          where: { id: tx.id },
          data: { aiCategory: category as SpendingCategory },
        });
        aiCategorized += 1;

        const key = getMerchantKey(tx.merchantName ?? tx.description);
        if (key && !merchantCache.has(key)) {
          merchantCache.set(key, category as SpendingCategory);
        }
      }
    } catch (error) {
      console.error('[categorize] AI batch failed:', error);
      // Stop early on a hard failure (e.g. exhausted retries) rather than
      // hammering the rate-limited provider.
      break;
    }
  }

  // 6. Report how many remain uncategorized for the caller / next run.
  const remaining = await db.transaction.count({
    where: {
      account: { connection: { userId } },
      aiCategory: null,
    },
  });

  return { aiCategorized, cached: cachedUpdates.length, remaining };
}
