'use client';

import {
  faBoltLightning,
  faCircleCheck,
} from '@fortawesome/pro-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useState } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';

/**
 * Hero product mockup — a real Genwel dashboard rendered in the site's design
 * tokens (crisp at any DPI, theme-aware). The spending donut is an interactive
 * Recharts pie: hover a segment to highlight it and read the category + amount
 * in the centre. Leads with what sets Genwel apart: net worth, the Fixable
 * Problem card (money-saving finds), and spending at a glance.
 */

const SEGMENTS = [
  { label: 'Groceries', value: 486, color: 'var(--primary)' },
  { label: 'Eating out', value: 364, color: 'var(--accent)' },
  { label: 'Bills', value: 318, color: 'oklch(0.6 0.12 210)' },
  { label: 'Shopping', value: 212, color: 'oklch(0.7 0.14 300)' },
  { label: 'Other', value: 137, color: 'oklch(0.75 0.02 180)' },
];

const TOTAL = SEGMENTS.reduce((s, x) => s + x.value, 0);
const gbp = (n: number) =>
  new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 0,
  }).format(n);

export default function HeroMockup() {
  const [active, setActive] = useState<number | null>(null);
  const focus = active !== null ? SEGMENTS[active] : null;

  return (
    <div className="relative mx-auto w-full max-w-sm">
      <div className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-primary/10 blur-3xl" />

      <div className="flex flex-col gap-4 rounded-3xl border border-border bg-card p-5 shadow-2xl">
        {/* Net worth */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground">
              Net worth
            </p>
            <p className="text-2xl font-bold tracking-tight text-foreground">
              £24,318
            </p>
          </div>
          <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
            +£412 this month
          </span>
        </div>

        {/* Fixable Problem — the differentiator */}
        <div className="rounded-2xl bg-primary p-4 text-primary-foreground">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary-foreground/80">
            <FontAwesomeIcon icon={faBoltLightning} className="h-3 w-3" />
            Fixable problem found
          </div>
          <p className="mt-2 text-sm font-medium leading-snug">
            You’re paying for Netflix and Disney+. Cancelling one saves you
            about £96 a year.
          </p>
        </div>

        {/* Interactive spending donut */}
        <div className="flex items-center gap-3 rounded-2xl border border-border p-4">
          <div className="relative h-28 w-28 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={SEGMENTS}
                  dataKey="value"
                  innerRadius={38}
                  outerRadius={54}
                  paddingAngle={2}
                  stroke="none"
                  startAngle={90}
                  endAngle={-270}
                  onMouseEnter={(_, i) => setActive(i)}
                  onMouseLeave={() => setActive(null)}
                >
                  {SEGMENTS.map((s, i) => (
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
            {/* centre label */}
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-[10px] font-medium text-muted-foreground">
                {focus ? focus.label : 'Spent'}
              </span>
              <span className="text-sm font-bold tabular-nums text-foreground">
                {gbp(focus ? focus.value : TOTAL)}
              </span>
            </div>
          </div>

          <div className="flex flex-1 flex-col gap-1.5">
            {SEGMENTS.map((s, i) => (
              <button
                key={s.label}
                type="button"
                onMouseEnter={() => setActive(i)}
                onMouseLeave={() => setActive(null)}
                className={`flex items-center gap-2 rounded-md px-1.5 py-0.5 text-left text-xs transition-colors ${
                  active === i ? 'bg-muted' : ''
                }`}
              >
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: s.color }}
                />
                <span className="text-foreground/80">{s.label}</span>
                <span className="ml-auto font-medium tabular-nums text-muted-foreground">
                  {Math.round((s.value / TOTAL) * 100)}%
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Subscriptions tracked */}
        <div className="flex items-center gap-3 rounded-2xl border border-border p-3.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <FontAwesomeIcon icon={faCircleCheck} className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-medium text-foreground">
              12 subscriptions tracked
            </p>
            <p className="text-xs text-muted-foreground">
              £84.30 / month · nothing missed
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
