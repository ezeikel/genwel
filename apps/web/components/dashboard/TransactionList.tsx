import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { SpendingCategory } from '@genwel/db';
import {
  formatCategoryName,
  getCategoryColor,
  getCategoryIcon,
} from '@/lib/budget-utils';

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
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="divide-y divide-gray-100">
        {transactions.map((tx) => {
          const category = tx.category;
          const icon = getCategoryIcon(category);
          const colorClass = getCategoryColor(category);
          const isCredit = tx.amount > 0;

          return (
            <div
              key={tx.id}
              className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${colorClass}`}
              >
                <FontAwesomeIcon icon={icon} className="w-4 h-4" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">
                  {tx.merchantName || tx.description}
                </p>
                <p className="text-sm text-gray-500 truncate">
                  {tx.accountName} &middot;{' '}
                  {new Intl.DateTimeFormat('en-GB', {
                    dateStyle: 'medium',
                  }).format(tx.timestamp)}
                </p>
              </div>

              <div className="text-right">
                <p
                  className={`font-semibold ${
                    isCredit ? 'text-green-600' : 'text-gray-900'
                  }`}
                >
                  {isCredit ? '+' : '-'}
                  {new Intl.NumberFormat('en-GB', {
                    style: 'currency',
                    currency: tx.currency,
                  }).format(Math.abs(tx.amount))}
                </p>
                <p className="text-xs text-gray-400">
                  {formatCategoryName(category)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
