import { db, type SpendingCategory } from '@genwel/db';
import { tool } from 'ai';
import { z } from 'zod/v3';
import { getFixableProblems } from '@/actions/fixable-problems';
import { buildNetWorthSummary, type OverviewAccount } from '@/lib/accounts';
import { effectiveCategory, formatCategoryName } from '@/lib/budget-utils';
import { buildSubscriptionReport, type TxnLike } from '@/lib/subscriptions';

/**
 * Tools for the Ask Genwel chat — each reads the SIGNED-IN user's real data so
 * the assistant answers from actual numbers, not guesses. `userId` is bound in
 * the route (never taken from the model), so a tool can only ever read the
 * authenticated user's own data.
 */

const gbp = (n: number) => `£${n.toFixed(2)}`;

export function buildChatTools(userId: string) {
  return {
    getBalances: tool({
      description:
        "Get the user's account balances and net worth: cash, savings, and credit-card debt, plus each account.",
      inputSchema: z.object({}),
      execute: async () => {
        const rows = await db.bankAccount.findMany({
          where: { connection: { userId } },
          include: { connection: { select: { providerName: true } } },
        });
        const accounts: OverviewAccount[] = rows.map((a) => ({
          id: a.id,
          accountType: a.accountType,
          displayName: a.displayName,
          providerName: a.connection.providerName,
          currency: a.currency,
          balance: Number(a.balance) || 0,
          balanceUpdatedAt: a.balanceUpdatedAt,
        }));
        const summary = buildNetWorthSummary(accounts);
        return {
          netWorth: gbp(summary.netWorth),
          groups: summary.groups.map((g) => ({
            kind: g.kind,
            total: gbp(g.total),
            accounts: g.accounts.map((a) => ({
              name: a.displayName,
              provider: a.providerName,
              balance: gbp(a.balance),
            })),
          })),
        };
      },
    }),

    getSpending: tool({
      description:
        'Get the user total spending, optionally for a specific category and/or a number of past months. Returns a per-category breakdown.',
      inputSchema: z.object({
        category: z
          .string()
          .optional()
          .describe(
            'Optional spending category, e.g. GROCERIES, EATING_OUT, BILLS, SUBSCRIPTIONS, TRANSPORT.',
          ),
        monthsBack: z
          .number()
          .int()
          .min(1)
          .max(12)
          .default(1)
          .describe(
            'How many months back to include (default 1 = this month).',
          ),
      }),
      execute: async ({ category, monthsBack }) => {
        const since = new Date();
        since.setMonth(since.getMonth() - (monthsBack - 1));
        since.setDate(1);
        since.setHours(0, 0, 0, 0);

        const txns = await db.transaction.findMany({
          where: {
            account: { connection: { userId } },
            amount: { lt: 0 },
            timestamp: { gte: since },
          },
          select: { amount: true, aiCategory: true, category: true },
        });

        const byCat = new Map<SpendingCategory, number>();
        for (const t of txns) {
          const cat = effectiveCategory(t);
          byCat.set(cat, (byCat.get(cat) ?? 0) + Math.abs(Number(t.amount)));
        }

        let entries = [...byCat.entries()];
        if (category) {
          const want = category.toUpperCase();
          entries = entries.filter((e) => e[0] === want);
        }
        entries.sort((a, b) => b[1] - a[1]);

        const total = entries.reduce((s, [, v]) => s + v, 0);
        return {
          period: `last ${monthsBack} month${monthsBack === 1 ? '' : 's'}`,
          total: gbp(total),
          byCategory: entries.map(([cat, amt]) => ({
            category: formatCategoryName(cat),
            amount: gbp(amt),
          })),
        };
      },
    }),

    getSubscriptions: tool({
      description:
        "Get the user's recurring subscriptions and bills: monthly and yearly totals, each subscription, and any overlaps or price rises.",
      inputSchema: z.object({}),
      execute: async () => {
        const since = new Date();
        since.setMonth(since.getMonth() - 6);
        const rows = await db.transaction.findMany({
          where: {
            account: { connection: { userId } },
            amount: { lt: 0 },
            timestamp: { gte: since },
          },
          select: {
            description: true,
            merchantName: true,
            amount: true,
            aiCategory: true,
            category: true,
            timestamp: true,
          },
        });
        const report = buildSubscriptionReport(
          rows.map(
            (r): TxnLike => ({
              description: r.description,
              merchantName: r.merchantName,
              amount: Number(r.amount),
              aiCategory: r.aiCategory,
              category: r.category,
              timestamp: r.timestamp,
            }),
          ),
        );
        return {
          monthlyTotal: gbp(report.monthlyTotal),
          yearlyTotal: gbp(report.yearlyTotal),
          count: report.subscriptions.length,
          subscriptions: report.subscriptions.slice(0, 25).map((s) => ({
            name: s.name,
            amount: gbp(s.amount),
            cadence: s.cadence,
            priceRise: s.priceRise ? gbp(s.priceRise.delta) : null,
          })),
          overlaps: report.duplicates.map((d) => ({
            kind: d.label,
            services: d.subscriptions.map((s) => s.name),
            couldSavePerMonth: gbp(d.potentialMonthlySaving),
          })),
        };
      },
    }),

    getFixableProblems: tool({
      description:
        "Get the user's ranked money-saving opportunities: duplicate subscriptions, price rises, and over-budget categories, with estimated savings.",
      inputSchema: z.object({}),
      execute: async () => {
        const result = await getFixableProblems();
        return {
          totalPotentialSaving: gbp(result.totalSaving),
          problems: result.problems.map((p) => ({
            title: p.title,
            detail: p.detail,
            estimatedSaving: gbp(p.estimatedSaving),
            severity: p.severity,
          })),
        };
      },
    }),
  };
}
