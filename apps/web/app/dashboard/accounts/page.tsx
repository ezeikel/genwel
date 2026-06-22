import { db } from '@genwel/db';
import { auth } from '@/auth';
import AccountCard from '@/components/dashboard/AccountCard';
import ConnectBankButton from '@/components/dashboard/ConnectBankButton';
import EmptyState from '@/components/dashboard/EmptyState';

export const metadata = {
  title: 'Accounts - Genwel',
  description: 'View and manage your connected bank accounts',
};

export default async function AccountsPage() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return null;
  }

  // Get bank connections with accounts
  const connections = await db.bankConnection.findMany({
    where: { userId },
    include: {
      bankAccounts: true,
    },
    orderBy: { connectedAt: 'desc' },
  });

  if (connections.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Accounts</h1>
        <EmptyState />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Accounts</h1>
        <ConnectBankButton />
      </div>

      <div className="space-y-8">
        {connections.map((connection: (typeof connections)[number]) => (
          <div key={connection.id}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {connection.providerName}
                </h2>
                <p className="text-sm text-gray-500">
                  Connected{' '}
                  {new Intl.DateTimeFormat('en-GB', {
                    dateStyle: 'medium',
                  }).format(connection.connectedAt)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {connection.bankAccounts.map(
                (account: (typeof connection.bankAccounts)[number]) => (
                  <AccountCard
                    key={account.id}
                    account={{
                      id: account.id,
                      displayName: account.displayName,
                      accountType: account.accountType,
                      balance: Number(account.balance) || 0,
                      currency: account.currency,
                      balanceUpdatedAt: account.balanceUpdatedAt,
                    }}
                    connectionId={connection.id}
                  />
                ),
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
