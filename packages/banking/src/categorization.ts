import { generateObject } from 'ai';
import { z } from 'zod/v3';
import { models } from './models';
import { withRetry } from './retry-utils';

const SPENDING_CATEGORIES = [
  'SHOPPING',
  'GROCERIES',
  'EATING_OUT',
  'BILLS',
  'TRANSPORT',
  'ENTERTAINMENT',
  'HEALTH',
  'PERSONAL_CARE',
  'EDUCATION',
  'TRANSFER',
  'CASH',
  'INCOME',
  'FEES',
  'SAVINGS',
  'REMITTANCES',
  'SUBSCRIPTIONS',
  'OTHER',
] as const;

const categorizationSchema = z.object({
  results: z.array(
    z.object({
      id: z.string(),
      category: z.enum(SPENDING_CATEGORIES),
      confidence: z.number().min(0).max(1),
    }),
  ),
});

export interface TransactionForCategorization {
  id: string;
  merchantName: string | null;
  description: string;
  category: string | null; // original TrueLayer category
  amount: number;
}

/**
 * Categorize a batch of transactions using Gemini Flash.
 * Batches of up to 20 transactions per call.
 * Returns a map of transaction ID → category.
 */
export async function categorizeTransactionBatch(
  transactions: TransactionForCategorization[],
): Promise<Map<string, (typeof SPENDING_CATEGORIES)[number]>> {
  if (transactions.length === 0) return new Map();

  // Format transactions for the prompt — only merchant/description/category/amount
  const txList = transactions.map((tx) => ({
    id: tx.id,
    merchant: tx.merchantName || 'Unknown',
    description: tx.description,
    originalCategory: tx.category || 'Unknown',
    amount: tx.amount,
  }));

  const { object } = await withRetry(
    () =>
      generateObject({
        model: models.analytics,
        schema: categorizationSchema,
        prompt: `You are a UK financial transaction categorizer. Categorize each transaction into one of these categories:

SHOPPING - Retail purchases (Amazon, John Lewis, Primark, etc.)
GROCERIES - Supermarkets and food shops (Tesco, Sainsbury's, Aldi, Lidl, M&S Food, etc.)
EATING_OUT - Restaurants, cafes, takeaways, food delivery (Deliveroo, Uber Eats, Nando's, Costa, etc.)
BILLS - Utilities, council tax, phone contracts, insurance, rent, mortgage (BT, EE, Thames Water, etc.)
TRANSPORT - Travel costs (TfL, Uber, petrol stations, train tickets, etc.)
ENTERTAINMENT - Streaming, cinema, events, gaming (Netflix, Spotify, Sky, etc.)
HEALTH - NHS prescriptions, pharmacies, gym memberships, opticians (Boots pharmacy, PureGym, etc.)
PERSONAL_CARE - Haircuts, beauty, cosmetics (Superdrug, barbers, salons)
EDUCATION - Courses, books, tuition (Udemy, university fees, WHSmith)
TRANSFER - Bank transfers between own accounts
CASH - ATM withdrawals
INCOME - Salary, refunds, benefits
FEES - Bank charges, interest, overdraft fees
SAVINGS - Transfers to savings accounts, ISAs, investments
REMITTANCES - International money transfers (Western Union, Wise, Remitly)
SUBSCRIPTIONS - Recurring memberships not covered above (gym separate — put under HEALTH)
OTHER - Anything that doesn't fit above

Descriptions may include payment-gateway prefixes (PAYPAL *, SQ *, SUMUP *, ZETTLE *), embedded dates (e.g. 08JUL26), card suffixes, location/country codes and long reference numbers. IGNORE all of these and categorize by the actual MERCHANT.

Examples:
"4752 05JUL26 PAYPAL *UBER EATS 35314369001 GB" -> EATING_OUT
"4752 25JUN26 PAYPAL *ADOBESYSTEM 35314369001 GB" -> SUBSCRIPTIONS
"MONEYBOX" -> SAVINGS
"ANTHROPIC SAN FRANCISCO CA USA 8590" -> SUBSCRIPTIONS
"SAINSBURYS S/MKTS SYDENHAM 693 GBR 8590" -> GROCERIES

For each transaction, return the ID, best-fit category, and confidence (0-1).

Transactions to categorize:
${JSON.stringify(txList, null, 2)}`,
      }),
    { label: 'categorize-batch', maxAttempts: 4 },
  );

  const resultMap = new Map<string, (typeof SPENDING_CATEGORIES)[number]>();
  for (const r of object.results) {
    // Skip low-confidence guesses so the transaction stays uncategorized and is retried later
    if (r.confidence >= 0.5) {
      resultMap.set(r.id, r.category);
    }
  }
  return resultMap;
}
