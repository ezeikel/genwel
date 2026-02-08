"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { BudgetProgressItem } from "@/actions/budgets";
import {
  formatCategoryName,
  getCategoryChartColor,
  formatCurrency,
} from "@/lib/budget-utils";

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
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex items-center justify-center h-64">
        <p className="text-gray-400">No spending data yet</p>
      </div>
    );
  }

  const totalSpent = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <h3 className="text-sm font-medium text-gray-500 mb-4">
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
                stroke="#fff"
              >
                {data.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{
                  borderRadius: "0.75rem",
                  border: "1px solid #e5e7eb",
                  fontSize: "0.875rem",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 space-y-2">
          {data.map((entry) => (
            <div key={entry.name} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-gray-700">{entry.name}</span>
              </div>
              <span className="font-medium text-gray-900">
                {formatCurrency(entry.value)}
              </span>
            </div>
          ))}
          <div className="pt-2 border-t border-gray-100 flex justify-between text-sm font-medium">
            <span className="text-gray-700">Total</span>
            <span className="text-gray-900">{formatCurrency(totalSpent)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
