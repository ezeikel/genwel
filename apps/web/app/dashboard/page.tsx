import { faArrowRight } from '@fortawesome/pro-light-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { db } from '@genwel/db';
import Link from 'next/link';
import { getBudgetProgress } from '@/actions/budgets';
import { auth } from '@/auth';
import BalanceCard from '@/components/dashboard/BalanceCard';
import ConnectBankButton from '@/components/dashboard/ConnectBankButton';
import EmptyState from '@/components/dashboard/EmptyState';
import TransactionList from '@/components/dashboard/TransactionList';
import {
  formatCategoryName,
  formatCurrency,
  getBudgetStatus,
  getCategoryColor,
  getCategoryIcon,
} from '@/lib/budget-utils';

export default async function DashboardPage() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return null;
  }

  // Get bank accounts
  const bankAccounts = await db.bankAccount.findMany({
    where: {
      connection: {
        userId,
      },
    },
    include: {
      connection: {
        select: {
          providerName: true,
        },
      },
    },
  });

  // Get recent transactions
  const recentTransactions = await db.transaction.findMany({
    where: {
      account: {
        connection: {
          userId,
        },
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
    take: 10,
  });

  // Calculate total balance
  const totalBalance = bankAccounts.reduce(
    (sum: number, account: (typeof bankAccounts)[number]) =>
      sum + (Number(account.balance) || 0),
    0,
  );

  // If no accounts, show empty state
  if (bankAccounts.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Dashboard</h1>
        <EmptyState />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <ConnectBankButton />
      </div>

      {/* Balance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <BalanceCard
          title="Total Balance"
          amount={totalBalance}
          currency="GBP"
          variant="primary"
        />
        <BalanceCard
          title="Accounts Connected"
          amount={bankAccounts.length}
          isCount
        />
        <BalanceCard
          title="This Month"
          amount={recentTransactions.reduce(
            (sum: number, tx: (typeof recentTransactions)[number]) =>
              sum + (Number(tx.amount) < 0 ? Number(tx.amount) : 0),
            0,
          )}
          currency="GBP"
          label="Spent"
        />
      </div>

      {/* Accounts Summary */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Your Accounts
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bankAccounts.map((account: (typeof bankAccounts)[number]) => (
            <div
              key={account.id}
              className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">
                  {account.connection.providerName}
                </span>
                <span className="text-xs bg-gray-100 px-2 py-1 rounded-full capitalize">
                  {account.accountType}
                </span>
              </div>
              <p className="font-medium text-gray-900">{account.displayName}</p>
              <p className="text-xl font-bold text-gray-900 mt-2">
                {new Intl.NumberFormat('en-GB', {
                  style: 'currency',
                  currency: account.currency,
                }).format(Number(account.balance) || 0)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Budget Status */}
      <BudgetStatusSummary />

      {/* Recent Transactions */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Recent Transactions
          </h2>
          <a
            href="/dashboard/transactions"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            View all
          </a>
        </div>
        <TransactionList
          transactions={recentTransactions.map(
            (tx: (typeof recentTransactions)[number]) => ({
              id: tx.id,
              description: tx.description,
              amount: Number(tx.amount),
              currency: tx.currency,
              category: tx.category,
              merchantName: tx.merchantName,
              timestamp: tx.timestamp,
              accountName: tx.account.displayName,
              providerName: tx.account.connection.providerName,
            }),
          )}
        />
      </div>
    </div>
  );
}

async function BudgetStatusSummary() {
  const result = await getBudgetProgress();
  if ('error' in result || !result.progress || result.progress.length === 0) {
    return null;
  }

  // Show top 3 categories by percent used
  const top3 = [...result.progress]
    .sort((a, b) => b.percentUsed - a.percentUsed)
    .slice(0, 3);

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Budget Status</h2>
        <Link
          href="/dashboard/budgets"
          className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
        >
          View all
          <FontAwesomeIcon icon={faArrowRight} className="w-3 h-3" />
        </Link>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-100">
        {top3.map((item) => {
          const icon = getCategoryIcon(item.category);
          const colorClass = getCategoryColor(item.category);
          const status = getBudgetStatus(item.percentUsed);
          const barColor =
            status === 'over_budget'
              ? 'bg-red-500'
              : status === 'warning'
                ? 'bg-amber-500'
                : 'bg-green-500';

          return (
            <div key={item.category} className="flex items-center gap-4 p-4">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${colorClass}`}
              >
                <FontAwesomeIcon icon={icon} className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-gray-900">
                    {formatCategoryName(item.category)}
                  </span>
                  <span className="text-gray-500">
                    {formatCurrency(item.spent)} /{' '}
                    {formatCurrency(item.budgetAmount)}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${barColor} transition-all`}
                    style={{ width: `${Math.min(item.percentUsed, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
