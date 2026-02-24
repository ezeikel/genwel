import { db, SpendingCategory } from "@genwel/db";
import {
  categorizeTransactionBatch,
  type TransactionForCategorization,
} from "@/lib/ai/categorization";

const BATCH_SIZE = 20;

/**
 * Categorize uncategorized transactions using AI for a given user.
 * Uses merchant caching: if a merchant was already categorized, reuse that.
 * Plain utility (NOT a server action) — safe to call from server components.
 */
export async function categorizeUserTransactions(userId: string) {
  const uncategorized = await db.transaction.findMany({
    where: {
      account: { connection: { userId } },
      aiCategory: null,
    },
    take: 200,
    orderBy: { timestamp: "desc" },
  });

  if (uncategorized.length === 0) return { categorized: 0, cached: 0 };

  // Build merchant cache from already-categorized transactions
  const existingCategorized = await db.transaction.findMany({
    where: {
      account: { connection: { userId } },
      aiCategory: { not: null },
      merchantName: { not: null },
    },
    select: { merchantName: true, aiCategory: true },
    distinct: ["merchantName"],
  });

  const merchantCache = new Map<string, SpendingCategory>();
  for (const tx of existingCategorized) {
    if (tx.merchantName && tx.aiCategory) {
      merchantCache.set(tx.merchantName.toLowerCase(), tx.aiCategory);
    }
  }

  // Split into cached and uncached
  const needsAi: TransactionForCategorization[] = [];
  const cachedUpdates: { id: string; category: SpendingCategory }[] = [];

  for (const tx of uncategorized) {
    const merchant = tx.merchantName?.toLowerCase();
    if (merchant && merchantCache.has(merchant)) {
      cachedUpdates.push({
        id: tx.id,
        category: merchantCache.get(merchant)!,
      });
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

  // Apply cached categories
  for (const { id, category } of cachedUpdates) {
    await db.transaction.update({
      where: { id },
      data: { aiCategory: category },
    });
  }

  // Batch AI categorization
  let aiCategorized = 0;
  for (let i = 0; i < needsAi.length; i += BATCH_SIZE) {
    const batch = needsAi.slice(i, i + BATCH_SIZE);
    try {
      const results = await categorizeTransactionBatch(batch);
      for (const [txId, category] of results) {
        await db.transaction.update({
          where: { id: txId },
          data: { aiCategory: category as SpendingCategory },
        });
        aiCategorized++;
      }
    } catch (error) {
      console.error("AI categorization batch failed:", error);
    }
  }

  return { categorized: aiCategorized, cached: cachedUpdates.length };
}
