'use client';

import { useState } from 'react';
import {
  Bar,
  BarChart,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatCurrency } from '@/lib/budget-utils';

/**
 * Monthly spend chart — one clean bar per month (total spent), the way every
 * premium finance app does it (Revolut, Wise, Quicken). No rainbow-stacked
 * categories: the chart answers one question — "is my spending going up or
 * down?" — and the category breakdown lives elsewhere.
 *
 * Brand teal bars; the hovered (or latest) month is highlighted in gold. A
 * dashed reference line marks the average monthly spend.
 */

// Recharts renders bars as SVG whose `fill` can't parse CSS `var()`/lab(),
// so brand colours are inlined as hex here.
const TEAL = '#1a5a5a';
const GOLD = '#d4a03c';
const MUTED = '#8a9a9a';

const compactGBP = (value: number) =>
  value >= 1000
    ? `£${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}k`
    : `£${Math.round(value)}`;

interface SpendingTrendChartProps {
  data: {
    month: string;
    total: number;
    [category: string]: string | number;
  }[];
}

export default function SpendingTrendChart({ data }: SpendingTrendChartProps) {
  const [active, setActive] = useState<number | null>(null);

  if (data.length === 0) return null;

  const totals = data.map((d) => d.total);
  const avg = totals.reduce((s, t) => s + t, 0) / (totals.length || 1);
  const focusIndex = active ?? data.length - 1;
  const focus = data[focusIndex];

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-1 flex items-baseline justify-between">
        <h3 className="text-sm font-semibold text-muted-foreground">
          {focus.month} spending
        </h3>
        <span className="text-xs text-muted-foreground">
          avg {formatCurrency(avg)}/mo
        </span>
      </div>
      <p className="mb-4 text-3xl font-bold tabular-nums text-foreground">
        {formatCurrency(focus.total)}
      </p>

      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
          >
            <XAxis
              dataKey="month"
              tick={{ fontSize: 12, fill: MUTED }}
              axisLine={false}
              tickLine={false}
              dy={6}
            />
            <YAxis
              tick={{ fontSize: 12, fill: MUTED }}
              axisLine={false}
              tickLine={false}
              width={44}
              tickFormatter={compactGBP}
            />
            <ReferenceLine y={avg} stroke={MUTED} strokeDasharray="4 4" />
            <Tooltip
              cursor={{ fill: 'rgba(26,90,90,0.06)' }}
              content={({ active: a, payload, label }) => {
                if (!a || !payload?.length) return null;
                return (
                  <div className="rounded-xl border border-border bg-card px-3 py-2 text-sm shadow-md">
                    <p className="font-semibold text-foreground">{label}</p>
                    <p className="tabular-nums text-muted-foreground">
                      {formatCurrency(Number(payload[0].value))}
                    </p>
                  </div>
                );
              }}
            />
            <Bar
              dataKey="total"
              radius={[8, 8, 0, 0]}
              maxBarSize={56}
              isAnimationActive={false}
              onMouseEnter={(_, i) => setActive(i)}
              onMouseLeave={() => setActive(null)}
            >
              {data.map((d, i) => (
                <Cell
                  key={d.month}
                  fill={i === focusIndex ? GOLD : TEAL}
                  opacity={active === null || i === focusIndex ? 1 : 0.55}
                  style={{ transition: 'opacity 150ms' }}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
