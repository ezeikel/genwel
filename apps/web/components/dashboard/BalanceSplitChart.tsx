'use client';

import { useState } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';
import { formatMoney } from '@/lib/accounts';

/**
 * Balance-split donut — how the net worth breaks down across cash, savings and
 * credit-card debt. Interactive (hover a segment or legend row to highlight it);
 * the centre shows the focused figure or total net worth. Brand-token colours.
 */

export type SplitSlice = {
  label: string;
  /** magnitude shown in the ring (debt shown as positive size) */
  value: number;
  /** signed value for the legend (debt negative) */
  signed: number;
  color: string;
};

export default function BalanceSplitChart({
  slices,
  netWorth,
}: {
  slices: SplitSlice[];
  netWorth: number;
}) {
  const [active, setActive] = useState<number | null>(null);
  const focus = active !== null ? slices[active] : null;
  const total = slices.reduce((s, x) => s + x.value, 0);

  if (slices.length === 0 || total === 0) return null;

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <h3 className="mb-4 text-sm font-semibold text-muted-foreground">
        Where your money sits
      </h3>
      <div className="flex items-center gap-5">
        <div className="relative h-40 w-40 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={slices}
                dataKey="value"
                cx="50%"
                cy="50%"
                innerRadius={54}
                outerRadius={78}
                paddingAngle={2}
                stroke="none"
                startAngle={90}
                endAngle={-270}
                onMouseEnter={(_, i) => setActive(i)}
                onMouseLeave={() => setActive(null)}
              >
                {slices.map((s, i) => (
                  <Cell
                    key={s.label}
                    fill={s.color}
                    opacity={active === null || active === i ? 1 : 0.35}
                    style={{ transition: 'opacity 150ms', cursor: 'pointer' }}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-[11px] font-medium text-muted-foreground">
              {focus ? focus.label : 'Net worth'}
            </span>
            <span className="text-lg font-bold tabular-nums text-foreground">
              {formatMoney(focus ? focus.signed : netWorth)}
            </span>
          </div>
        </div>

        <ul className="flex flex-1 flex-col gap-1.5">
          {slices.map((s, i) => (
            <li key={s.label}>
              <button
                type="button"
                onMouseEnter={() => setActive(i)}
                onMouseLeave={() => setActive(null)}
                className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors ${
                  active === i ? 'bg-muted' : ''
                }`}
              >
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: s.color }}
                />
                <span className="text-sm text-foreground/80">{s.label}</span>
                <span className="ml-auto text-sm font-semibold tabular-nums text-foreground">
                  {formatMoney(s.signed)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
