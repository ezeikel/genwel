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
    <div className="bg-card rounded-2xl p-5 shadow-sm border border-border hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs bg-muted px-2 py-1 rounded-full capitalize text-muted-foreground">
          {account.accountType.replace(/_/g, ' ')}
        </span>
      </div>

      <p className="font-medium text-foreground mb-1">{account.displayName}</p>

      <p className="text-2xl font-bold text-foreground mb-2">
        {new Intl.NumberFormat('en-GB', {
          style: 'currency',
          currency: account.currency,
        }).format(Math.abs(account.balance))}
        {account.accountType === 'credit_card' && (
          <span className="text-sm font-normal text-muted-foreground">
            {' '}
            owed
          </span>
        )}
      </p>

      {account.balanceUpdatedAt && (
        <p className="text-xs text-muted-foreground/70">
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
