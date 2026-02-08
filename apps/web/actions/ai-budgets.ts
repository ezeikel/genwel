"use server";

import { auth } from "@/auth";
import { db, SpendingCategory } from "@genwel/db";
import { revalidatePath } from "next/cache";
import {
  categorizeTransactionBatch,
  type TransactionForCategorization,
} from "@/lib/ai/categorization";
import { generateBudgetSuggestions } from "@/lib/ai/budget-suggestions";
import { generateSpendingInsights } from "@/lib/ai/insights";

const BATCH_SIZE = 20;

/**
 * Categorize uncategorized transactions using AI.
 * Uses merchant caching: if a merchant was already categorized, reuse that.
 */
export async function categorizeTransactions(options?: {
  force?: boolean;
  limit?: number;
}) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const limit = options?.limit ?? 200;

  // Fetch uncategorized transactions (or all if force)
  const where = options?.force
    ? { account: { connection: { userId: session.user.id } } }
    : {
        account: { connection: { userId: session.user.id } },
        aiCategory: null,
      };

  const uncategorized = await db.transaction.findMany({
    where,
    take: limit,
    orderBy: { timestamp: "desc" },
  });

  if (uncategorized.length === 0) return { categorized: 0, cached: 0 };

  // Build merchant cache from already-categorized transactions
  const existingCategorized = await db.transaction.findMany({
    where: {
      account: { connection: { userId: session.user.id } },
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
      cachedUpdates.push({ id: tx.id, category: merchantCache.get(merchant)! });
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

  revalidatePath("/dashboard/budgets");
  revalidatePath("/dashboard");

  return { categorized: aiCategorized, cached: cachedUpdates.length };
}

/**
 * Get AI-powered budget suggestions based on 3-month spending history.
 */
export async function getAiBudgetSuggestions() {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  // Get spending aggregated by aiCategory
  const spending = await db.transaction.groupBy({
    by: ["aiCategory"],
    where: {
      account: { connection: { userId: session.user.id } },
      aiCategory: { not: null },
      amount: { lt: 0 }, // debits only
      timestamp: { gte: threeMonthsAgo },
    },
    _sum: { amount: true },
    _count: true,
  });

  if (spending.length === 0) {
    return { error: "Not enough transaction data. Connect a bank and wait for transactions to be categorized." };
  }

  const spendingData = spending
    .filter((s) => s.aiCategory != null)
    .map((s) => ({
      category: s.aiCategory!,
      totalSpent: Math.abs(Number(s._sum.amount) || 0),
      transactionCount: s._count,
      monthlyAverage: Math.abs(Number(s._sum.amount) || 0) / 3,
    }));

  const suggestions = await generateBudgetSuggestions(spendingData);
  return { suggestions };
}

/**
 * Generate AI spending insights. Stored with 48h expiry.
 */
export async function generateInsights() {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  // Get current and previous period spending
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

  const [currentSpending, previousSpending, budgetConfig] = await Promise.all([
    db.transaction.groupBy({
      by: ["aiCategory"],
      where: {
        account: { connection: { userId: session.user.id } },
        aiCategory: { not: null },
        amount: { lt: 0 },
        timestamp: { gte: currentMonthStart },
      },
      _sum: { amount: true },
    }),
    db.transaction.groupBy({
      by: ["aiCategory"],
      where: {
        account: { connection: { userId: session.user.id } },
        aiCategory: { not: null },
        amount: { lt: 0 },
        timestamp: { gte: previousMonthStart, lte: previousMonthEnd },
      },
      _sum: { amount: true },
    }),
    db.budgetConfig.findUnique({
      where: { userId: session.user.id },
      include: { budgets: true },
    }),
  ]);

  const currentMap = new Map<SpendingCategory, number>();
  for (const s of currentSpending) {
    if (s.aiCategory) currentMap.set(s.aiCategory, Math.abs(Number(s._sum.amount) || 0));
  }

  const previousMap = new Map<SpendingCategory, number>();
  for (const s of previousSpending) {
    if (s.aiCategory) previousMap.set(s.aiCategory, Math.abs(Number(s._sum.amount) || 0));
  }

  const budgetMap = new Map<SpendingCategory, number>();
  if (budgetConfig) {
    for (const b of budgetConfig.budgets) {
      budgetMap.set(b.category, Number(b.amount));
    }
  }

  const insights = await generateSpendingInsights({
    currentSpending: currentMap,
    previousSpending: previousMap,
    budgets: budgetMap,
  });

  // Store insights with 48h expiry
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

  // Delete old insights first
  await db.aiInsight.deleteMany({
    where: { userId: session.user.id },
  });

  // Create new insights
  for (const insight of insights) {
    await db.aiInsight.create({
      data: {
        userId: session.user.id,
        type: insight.type,
        title: insight.title,
        body: insight.body,
        metadata: insight.metadata ?? undefined,
        expiresAt,
      },
    });
  }

  revalidatePath("/dashboard/insights");
  return { count: insights.length };
}

/**
 * Get non-expired insights. Generates new ones if none exist.
 */
export async function getInsights() {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  let insights = await db.aiInsight.findMany({
    where: {
      userId: session.user.id,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (insights.length === 0) {
    // Try to generate — silently fail if not enough data
    try {
      await generateInsights();
      insights = await db.aiInsight.findMany({
        where: {
          userId: session.user.id,
          expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: "desc" },
      });
    } catch {
      // Not enough data
    }
  }

  return {
    insights: insights.map((i) => ({
      id: i.id,
      type: i.type,
      title: i.title,
      body: i.body,
      metadata: i.metadata as Record<string, unknown> | null,
      read: i.read,
      createdAt: i.createdAt,
    })),
  };
}

/**
 * Mark an insight as read.
 */
export async function markInsightRead(insightId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  await db.aiInsight.updateMany({
    where: { id: insightId, userId: session.user.id },
    data: { read: true },
  });

  return { success: true };
}
