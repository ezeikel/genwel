interface AccountCardProps {
  account: {
    id: string;
    displayName: string;
    accountType: string;
    balance: number;
    currency: string;
    balanceUpdatedAt: Date | null;
  };
}

export default function AccountCard({ account }: AccountCardProps) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs bg-gray-100 px-2 py-1 rounded-full capitalize text-gray-600">
          {account.accountType.replace(/_/g, ' ')}
        </span>
      </div>

      <p className="font-medium text-gray-900 mb-1">{account.displayName}</p>

      <p className="text-2xl font-bold text-gray-900 mb-2">
        {new Intl.NumberFormat('en-GB', {
          style: 'currency',
          currency: account.currency,
        }).format(account.balance)}
      </p>

      {account.balanceUpdatedAt && (
        <p className="text-xs text-gray-400">
          Updated{' '}
          {new Intl.DateTimeFormat('en-GB', {
            dateStyle: 'short',
            timeStyle: 'short',
          }).format(account.balanceUpdatedAt)}
        </p>
      )}
    </div>
  );
}
