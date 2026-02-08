import { generateObject } from "ai";
import { z } from "zod";
import { models } from "@/lib/ai/models";
import type { SpendingCategory } from "@genwel/db";

const SPENDING_CATEGORIES = [
  "SHOPPING",
  "GROCERIES",
  "EATING_OUT",
  "BILLS",
  "TRANSPORT",
  "ENTERTAINMENT",
  "HEALTH",
  "PERSONAL_CARE",
  "EDUCATION",
  "TRANSFER",
  "CASH",
  "INCOME",
  "FEES",
  "SAVINGS",
  "REMITTANCES",
  "SUBSCRIPTIONS",
  "OTHER",
] as const;

const suggestionsSchema = z.object({
  suggestions: z.array(
    z.object({
      category: z.enum(SPENDING_CATEGORIES),
      amount: z.number().positive(),
      reasoning: z.string(),
    }),
  ),
});

interface SpendingData {
  category: SpendingCategory;
  totalSpent: number;
  transactionCount: number;
  monthlyAverage: number;
}

/**
 * Generate AI-powered budget suggestions based on 3-month spending history.
 * Uses the intelligent model (GPT-5.2) for high-quality financial advice.
 */
export async function generateBudgetSuggestions(
  spendingData: SpendingData[],
): Promise<{ category: SpendingCategory; amount: number; reasoning: string }[]> {
  const formattedSpending = spendingData.map((s) => ({
    category: s.category,
    monthlyAverage: `£${s.monthlyAverage.toFixed(2)}`,
    totalSpentLast3Months: `£${s.totalSpent.toFixed(2)}`,
    transactionCount: s.transactionCount,
  }));

  const { object } = await generateObject({
    model: models.intelligent,
    schema: suggestionsSchema,
    prompt: `You are a UK personal finance advisor. Based on this user's spending over the last 3 months, suggest monthly budget limits for each category.

Guidelines:
- Round all amounts to the nearest £5
- Consider UK cost of living (2024/2025 levels)
- For discretionary spending (eating out, entertainment, shopping), suggest a 5-10% reduction to encourage saving
- For essentials (bills, groceries, transport), suggest the monthly average rounded up to the nearest £5 — people can't easily cut these
- Only suggest budgets for categories where there's meaningful spending (> £10/month average)
- Be practical, not judgmental — these are real people's spending habits
- For subscriptions, suggest rounding to the nearest £5 above their average
- Don't include INCOME, TRANSFER, or FEES as budget categories

User's spending data (last 3 months):
${JSON.stringify(formattedSpending, null, 2)}`,
  });

  return object.suggestions as { category: SpendingCategory; amount: number; reasoning: string }[];
}
