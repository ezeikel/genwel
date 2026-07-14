import { db, type SpendingCategory } from '@genwel/db';
import { auth } from '@/auth';
import EmptyState from '@/components/dashboard/EmptyState';
import SpendingChart from '@/components/dashboard/SpendingChart';
import TransactionList from '@/components/dashboard/TransactionList';
import { effectiveCategory } from '@/lib/budget-utils';

export const metadata = {
  title: 'Transactions - Genwel',
  description: 'View your transaction history',
};

export default async function TransactionsPage() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return null;
  }

  // Get transactions from last 30 days
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const transactions = await db.transaction.findMany({
    where: {
      account: {
        connection: {
          userId,
        },
      },
      timestamp: {
        gte: thirtyDaysAgo,
      },
    },
    include: {
      account: {
        select: {
          displayName: true,
          connection: {
            select: {
              providerName: true,
            },
          },
        },
      },
    },
    orderBy: { timestamp: 'desc' },
  });

  // Check if user has any accounts
  const hasAccounts = await db.bankAccount.count({
    where: {
      connection: {
        userId,
      },
    },
  });

  if (hasAccounts === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-foreground mb-8">
          Transactions
        </h1>
        <EmptyState />
      </div>
    );
  }

  // Calculate spending by category, keyed on the effective (AI) category enum
  // so the chart can colour/label it via the shared helpers.
  const spendingByCategory = transactions.reduce(
    (acc: Record<string, number>, tx: (typeof transactions)[number]) => {
      if (Number(tx.amount) < 0) {
        const category = effectiveCategory(tx);
        acc[category] = (acc[category] || 0) + Math.abs(Number(tx.amount));
      }
      return acc;
    },
    {} as Record<string, number>,
  );

  const chartData = Object.entries(spendingByCategory)
    .map(([category, amount]) => ({
      category: category as SpendingCategory,
      amount: amount as number,
    }))
    .sort((a, b) => b.amount - a.amount);

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-foreground mb-8">Transactions</h1>

      {/* Spending Chart */}
      {chartData.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Spending by Category (Last 30 Days)
          </h2>
          <SpendingChart data={chartData} />
        </div>
      )}

      {/* Transaction List */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">
          All Transactions
        </h2>
        {transactions.length === 0 ? (
          <div className="bg-card rounded-2xl p-8 text-center">
            <p className="text-muted-foreground">No transactions yet</p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Transactions will appear here once synced from your bank
            </p>
          </div>
        ) : (
          <TransactionList
            transactions={transactions.map(
              (tx: (typeof transactions)[number]) => ({
                id: tx.id,
                description: tx.description,
                amount: Number(tx.amount),
                currency: tx.currency,
                category: effectiveCategory(tx),
                merchantName: tx.merchantName,
                timestamp: tx.timestamp,
                accountName: tx.account.displayName,
                providerName: tx.account.connection.providerName,
              }),
            )}
          />
        )}
      </div>
    </div>
  );
}
