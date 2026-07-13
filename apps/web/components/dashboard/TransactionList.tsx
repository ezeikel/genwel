import type { SpendingCategory } from '@genwel/db';
import { formatCategoryName } from '@/lib/budget-utils';
import MerchantIcon from './MerchantIcon';

interface Transaction {
  id: string;
  description: string;
  amount: number;
  currency: string;
  category: SpendingCategory;
  merchantName: string | null;
  timestamp: Date;
  accountName: string;
  providerName: string;
}

interface TransactionListProps {
  transactions: Transaction[];
}

export default function TransactionList({
  transactions,
}: TransactionListProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="divide-y divide-border">
        {transactions.map((tx) => {
          const isCredit = tx.amount > 0;
          const label = tx.merchantName || tx.description;

          return (
            <div
              key={tx.id}
              className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-muted/40"
            >
              <MerchantIcon merchant={label} category={tx.category} />

              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-foreground">{label}</p>
                <p className="truncate text-sm text-muted-foreground">
                  {tx.accountName} &middot;{' '}
                  {new Intl.DateTimeFormat('en-GB', {
                    dateStyle: 'medium',
                  }).format(tx.timestamp)}
                </p>
              </div>

              <div className="text-right">
                <p
                  className={`font-semibold tabular-nums ${
                    isCredit ? 'text-emerald-600' : 'text-foreground'
                  }`}
                >
                  {isCredit ? '+' : '-'}
                  {new Intl.NumberFormat('en-GB', {
                    style: 'currency',
                    currency: tx.currency,
                  }).format(Math.abs(tx.amount))}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatCategoryName(tx.category)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
