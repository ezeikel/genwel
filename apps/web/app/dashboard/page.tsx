import { auth } from "@/auth";
import { db } from "@genwel/db";
import BalanceCard from "@/components/dashboard/BalanceCard";
import TransactionList from "@/components/dashboard/TransactionList";
import ConnectBankButton from "@/components/dashboard/ConnectBankButton";
import EmptyState from "@/components/dashboard/EmptyState";

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
    orderBy: { timestamp: "desc" },
    take: 10,
  });

  // Calculate total balance
  const totalBalance = bankAccounts.reduce(
    (sum: number, account: typeof bankAccounts[number]) => sum + (Number(account.balance) || 0),
    0
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
            (sum: number, tx: typeof recentTransactions[number]) => sum + (Number(tx.amount) < 0 ? Number(tx.amount) : 0),
            0
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
          {bankAccounts.map((account: typeof bankAccounts[number]) => (
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
                {new Intl.NumberFormat("en-GB", {
                  style: "currency",
                  currency: account.currency,
                }).format(Number(account.balance) || 0)}
              </p>
            </div>
          ))}
        </div>
      </div>

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
          transactions={recentTransactions.map((tx: typeof recentTransactions[number]) => ({
            id: tx.id,
            description: tx.description,
            amount: Number(tx.amount),
            currency: tx.currency,
            category: tx.category,
            merchantName: tx.merchantName,
            timestamp: tx.timestamp,
            accountName: tx.account.displayName,
            providerName: tx.account.connection.providerName,
          }))}
        />
      </div>
    </div>
  );
}
