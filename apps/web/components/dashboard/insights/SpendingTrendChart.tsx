'use client';

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatCurrency } from '@/lib/budget-utils';

interface SpendingTrendChartProps {
  data: {
    month: string;
    total: number;
    [category: string]: string | number;
  }[];
}

const COLORS = [
  '#9333ea',
  '#2563eb',
  '#ea580c',
  '#16a34a',
  '#db2777',
  '#0284c7',
  '#dc2626',
  '#0d9488',
];

export default function SpendingTrendChart({ data }: SpendingTrendChartProps) {
  if (data.length === 0) return null;

  // Extract category keys (everything except 'month' and 'total')
  const categories = Object.keys(data[0] || {}).filter(
    (k) => k !== 'month' && k !== 'total',
  );

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <h3 className="text-sm font-medium text-gray-500 mb-4">
        Spending Trend (Last 3 Months)
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 12, fill: '#6b7280' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 12, fill: '#6b7280' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `£${v}`}
            />
            <Tooltip
              formatter={(value: number) => formatCurrency(value)}
              contentStyle={{
                borderRadius: '0.75rem',
                border: '1px solid #e5e7eb',
                fontSize: '0.875rem',
              }}
            />
            {categories.map((cat, i) => (
              <Area
                key={cat}
                type="monotone"
                dataKey={cat}
                stackId="1"
                fill={COLORS[i % COLORS.length]}
                stroke={COLORS[i % COLORS.length]}
                fillOpacity={0.6}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
