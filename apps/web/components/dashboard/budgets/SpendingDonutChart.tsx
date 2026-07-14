'use client';

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { BudgetProgressItem } from '@/actions/budgets';
import {
  formatCategoryName,
  formatCurrency,
  getCategoryChartColor,
} from '@/lib/budget-utils';

interface SpendingDonutChartProps {
  items: BudgetProgressItem[];
}

export default function SpendingDonutChart({ items }: SpendingDonutChartProps) {
  const data = items
    .filter((item) => item.spent > 0)
    .map((item) => ({
      name: formatCategoryName(item.category),
      value: item.spent,
      color: getCategoryChartColor(item.category),
    }));

  if (data.length === 0) {
    return (
      <div className="bg-card rounded-2xl p-6 shadow-sm border border-border flex items-center justify-center h-64">
        <p className="text-muted-foreground/70">No spending data yet</p>
      </div>
    );
  }

  const totalSpent = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
      <h3 className="text-sm font-medium text-muted-foreground mb-4">
        Spending Breakdown
      </h3>
      <div className="flex items-center gap-6">
        <div className="w-48 h-48 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                dataKey="value"
                strokeWidth={2}
                stroke="var(--card)"
              >
                {data.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{
                  borderRadius: '0.75rem',
                  border: '1px solid var(--border)',
                  background: 'var(--card)',
                  color: 'var(--foreground)',
                  fontSize: '0.875rem',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 space-y-2">
          {data.map((entry) => (
            <div
              key={entry.name}
              className="flex items-center justify-between text-sm"
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-foreground/80">{entry.name}</span>
              </div>
              <span className="font-medium text-foreground">
                {formatCurrency(entry.value)}
              </span>
            </div>
          ))}
          <div className="pt-2 border-t border-border flex justify-between text-sm font-medium">
            <span className="text-foreground/80">Total</span>
            <span className="text-foreground">
              {formatCurrency(totalSpent)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
