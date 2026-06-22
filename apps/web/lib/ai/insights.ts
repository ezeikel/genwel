import type { SpendingCategory } from '@genwel/db';
import { generateObject } from 'ai';
import { z } from 'zod/v3';
import { models } from '@/lib/ai/models';
import { formatCategoryName } from '@/lib/budget-utils';

const insightSchema = z.object({
  insights: z.array(
    z.object({
      type: z.enum([
        'spending_trend',
        'anomaly',
        'saving_tip',
        'budget_suggestion',
      ]),
      title: z.string(),
      body: z.string(),
      metadata: z
        .object({
          category: z.string().optional(),
          amount: z.number().optional(),
          percentChange: z.number().optional(),
        })
        .optional(),
    }),
  ),
});

interface InsightInput {
  currentSpending: Map<SpendingCategory, number>;
  previousSpending: Map<SpendingCategory, number>;
  budgets: Map<SpendingCategory, number>;
}

/**
 * Generate personalized spending insights comparing current vs previous period.
 * Uses the intelligent model (GPT-5.2) for high-quality, personalized advice.
 */
export async function generateSpendingInsights(input: InsightInput) {
  const { currentSpending, previousSpending, budgets } = input;

  // Build comparison data
  const allCategories = new Set([
    ...currentSpending.keys(),
    ...previousSpending.keys(),
  ]);

  const comparisonData = Array.from(allCategories).map((cat) => {
    const current = currentSpending.get(cat) || 0;
    const previous = previousSpending.get(cat) || 0;
    const budget = budgets.get(cat);
    const change = previous > 0 ? ((current - previous) / previous) * 100 : 0;

    return {
      category: formatCategoryName(cat),
      categoryKey: cat,
      currentMonth: `£${current.toFixed(2)}`,
      previousMonth: `£${previous.toFixed(2)}`,
      percentChange: `${change > 0 ? '+' : ''}${change.toFixed(0)}%`,
      budget: budget ? `£${budget.toFixed(2)}` : 'No budget set',
      overBudget: budget ? current > budget : false,
    };
  });

  if (comparisonData.length === 0) {
    return [];
  }

  const totalCurrent = Array.from(currentSpending.values()).reduce(
    (a, b) => a + b,
    0,
  );
  const totalPrevious = Array.from(previousSpending.values()).reduce(
    (a, b) => a + b,
    0,
  );

  const { object } = await generateObject({
    model: models.intelligent,
    schema: insightSchema,
    prompt: `You are a friendly UK personal finance advisor. Generate 3-5 personalised spending insights for this user.

Rules:
- Use British English (£, "favourite" not "favorite", etc.)
- Be supportive and encouraging, not judgmental
- Include specific GBP amounts
- Each insight should be actionable or informative
- Types: "spending_trend" (spending changes), "anomaly" (unusual charges), "saving_tip" (positive patterns), "budget_suggestion" (budget advice)
- Title: short, catchy (max 60 chars)
- Body: 1-2 sentences with specific numbers
- Include metadata where relevant (category, amount, percentChange)

Total spending: £${totalCurrent.toFixed(2)} this month vs £${totalPrevious.toFixed(2)} last month

Category breakdown:
${JSON.stringify(comparisonData, null, 2)}`,
  });

  return object.insights;
}
