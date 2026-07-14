'use client';

import type { SpendingCategory } from '@genwel/db';
import { formatCategoryName, getCategoryChartColor } from '@/lib/budget-utils';

interface SpendingChartProps {
  data: {
    category: SpendingCategory;
    amount: number;
  }[];
}

export default function SpendingChart({ data }: SpendingChartProps) {
  const total = data.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
      <div className="flex flex-wrap gap-4">
        {/* Simple bar chart */}
        <div className="flex-1 min-w-[200px]">
          <div className="space-y-3">
            {data.slice(0, 6).map((item) => {
              const percentage = (item.amount / total) * 100;
              const color = getCategoryChartColor(item.category);

              return (
                <div key={item.category}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">
                      {formatCategoryName(item.category)}
                    </span>
                    <span className="font-medium text-foreground">
                      {new Intl.NumberFormat('en-GB', {
                        style: 'currency',
                        currency: 'GBP',
                      }).format(item.amount)}
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Summary */}
        <div className="w-full md:w-48 flex flex-col justify-center items-center p-4 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground mb-1">Total Spent</p>
          <p className="text-2xl font-bold text-foreground">
            {new Intl.NumberFormat('en-GB', {
              style: 'currency',
              currency: 'GBP',
            }).format(total)}
          </p>
          <p className="text-xs text-muted-foreground/70 mt-1">Last 30 days</p>
        </div>
      </div>
    </div>
  );
}
