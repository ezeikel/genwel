import { db, type SpendingCategory } from '@genwel/db';
import { buildNetWorthSummary, type OverviewAccount } from '@/lib/accounts';
import { effectiveCategory } from '@/lib/budget-utils';
import { getEntitlementsForUser } from '@/lib/entitlements';
import { getFixableProblemsForUser } from '@/lib/fixable-problems-data';
import { merchantDomain } from '@/lib/merchant-logos';
import { getSubscriptionReportForUser } from '@/lib/subscription-data';

const mapTransaction = <
  T extends {
    id: string;
    description: string;
    amount: unknown;
    currency: string;
    aiCategory: SpendingCategory | null;
    category: string | null;
    merchantName: string | null;
    timestamp: Date;
    account: {
      displayName: string;
      connection: { providerName: string };
    };
  },
>(
  transaction: T,
) => {
  const merchant = transaction.merchantName || transaction.description;
  return {
    id: transaction.id,
    description: transaction.description,
    amount: Number(transaction.amount),
    currency: transaction.currency,
    category: effectiveCategory(transaction),
    merchantName: transaction.merchantName,
    merchantDomain: merchantDomain(merchant),
    timestamp: transaction.timestamp,
    accountName: transaction.account.displayName,
    providerName: transaction.account.connection.providerName,
  };
};

const transactionInclude = {
  account: {
    select: {
      displayName: true,
      connection: { select: { providerName: true } },
    },
  },
} as const;

/** Complete command-centre payload shared by the native API and web surface. */
export async function getOverviewForUser(userId: string) {
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [bankAccounts, monthAgg, recentRows, report, entitlements, insight] =
    await Promise.all([
      db.bankAccount.findMany({
        where: { connection: { userId } },
        include: { connection: { select: { providerName: true } } },
      }),
      db.transaction.aggregate({
        where: {
          account: { connection: { userId } },
          timestamp: { gte: monthStart },
        },
        _sum: { amount: true },
      }),
      db.transaction.findMany({
        where: { account: { connection: { userId } } },
        include: transactionInclude,
        orderBy: { timestamp: 'desc' },
        take: 8,
      }),
      getSubscriptionReportForUser(userId),
      getEntitlementsForUser(userId),
      db.aiInsight.findFirst({
        where: { userId, expiresAt: { gt: new Date() } },
        select: { id: true, type: true, title: true, body: true },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

  const accounts: OverviewAccount[] = bankAccounts.map((account) => ({
    id: account.id,
    accountType: account.accountType,
    displayName: account.displayName,
    providerName: account.connection.providerName,
    currency: account.currency,
    balance: Number(account.balance) || 0,
    balanceUpdatedAt: account.balanceUpdatedAt,
  }));
  const summary = buildNetWorthSummary(accounts);
  const fixableProblems = await getFixableProblemsForUser(userId, report);

  return {
    summary,
    monthDelta:
      monthAgg._sum.amount === null ? null : Number(monthAgg._sum.amount),
    recentTransactions: recentRows.map(mapTransaction),
    subscriptions: report,
    fixableProblems,
    insight,
    entitlements,
  };
}

/** Transaction history plus the category totals needed by both clients. */
export async function getTransactionsForUser(
  userId: string,
  requestedDays = 30,
) {
  const entitlements = await getEntitlementsForUser(userId);
  const safeRequestedDays = Math.min(
    Math.max(Math.round(requestedDays), 1),
    365,
  );
  const days = entitlements.features.fullHistory
    ? safeRequestedDays
    : Math.min(safeRequestedDays, 31);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [rows, accountCount] = await Promise.all([
    db.transaction.findMany({
      where: {
        account: { connection: { userId } },
        timestamp: { gte: since },
      },
      include: transactionInclude,
      orderBy: { timestamp: 'desc' },
    }),
    db.bankAccount.count({ where: { connection: { userId } } }),
  ]);

  const spending = new Map<SpendingCategory, number>();
  for (const row of rows) {
    if (Number(row.amount) >= 0) continue;
    const category = effectiveCategory(row);
    spending.set(
      category,
      (spending.get(category) ?? 0) + Math.abs(Number(row.amount)),
    );
  }

  return {
    days,
    hasAccounts: accountCount > 0,
    transactions: rows.map(mapTransaction),
    spendingByCategory: [...spending.entries()]
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount),
    entitlements,
  };
}
