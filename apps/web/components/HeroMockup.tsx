'use client';

import {
  faArrowTrendUp,
  faBoltLightning,
  faLightbulb,
} from '@fortawesome/pro-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useState } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';

/**
 * Hero product mockup — a real Genwel dashboard surface rendered in the site's
 * design tokens (crisp at any DPI, theme-aware). A richer, dashboard-style
 * cluster than a single card: net worth, an interactive spending donut, the
 * Fixable Problem card (the money-saving find), a budget bar, and a smart
 * insight. Some figures are illustrative placeholders until the real product
 * UI is wired in here.
 */

const SEGMENTS = [
  { label: 'Groceries', value: 486, color: 'var(--primary)' },
  { label: 'Eating out', value: 364, color: 'var(--accent)' },
  { label: 'Bills', value: 318, color: 'oklch(0.6 0.12 210)' },
  { label: 'Shopping', value: 212, color: 'oklch(0.7 0.14 300)' },
  { label: 'Other', value: 137, color: 'oklch(0.75 0.02 180)' },
];
const TOTAL = SEGMENTS.reduce((s, x) => s + x.value, 0);

// Illustrative 6-month net-worth trend (placeholder — real series lands later).
const TREND = [18, 19.2, 18.6, 21, 22.4, 24.3];

const gbp = (n: number) =>
  new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 0,
  }).format(n);

function TrendLine() {
  const w = 132;
  const h = 40;
  const min = Math.min(...TREND);
  const max = Math.max(...TREND);
  const pts = TREND.map((v, i) => {
    const x = (i / (TREND.length - 1)) * w;
    const y = h - ((v - min) / (max - min || 1)) * h;
    return [x, y] as const;
  });
  const line = pts.map(([x, y]) => `${x},${y}`).join(' ');
  const area = `0,${h} ${line} ${w},${h}`;
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="h-10 w-full"
      preserveAspectRatio="none"
    >
      <polygon points={area} fill="var(--primary)" opacity="0.1" />
      <polyline
        points={line}
        fill="none"
        stroke="var(--primary)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={pts.at(-1)![0]}
        cy={pts.at(-1)![1]}
        r="3"
        fill="var(--primary)"
      />
    </svg>
  );
}

export default function HeroMockup() {
  const [active, setActive] = useState<number | null>(null);
  const focus = active !== null ? SEGMENTS[active] : null;

  return (
    <div className="relative mx-auto w-full max-w-md lg:max-w-lg">
      {/* atmospheric glow */}
      <div className="absolute -inset-8 -z-10 rounded-[3rem] bg-primary/15 blur-3xl" />
      <div className="absolute -right-10 top-1/3 -z-10 h-40 w-40 rounded-full bg-accent/20 blur-3xl" />

      {/* Dashboard surface */}
      <div className="rounded-3xl border border-border bg-card p-4 shadow-2xl">
        {/* Top row: net worth + trend */}
        <div className="flex items-end justify-between rounded-2xl bg-foreground p-4 text-background">
          <div>
            <p className="text-xs font-medium opacity-70">Net worth</p>
            <p className="text-2xl font-bold tracking-tight">£24,318</p>
            <p className="mt-1 text-xs font-medium text-emerald-400">
              +£412 this month
            </p>
          </div>
          <div className="w-36 opacity-90">
            <TrendLine />
          </div>
        </div>

        {/* Fixable problem — the differentiator */}
        <div className="mt-3 rounded-2xl bg-primary p-4 text-primary-foreground">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary-foreground/80">
            <FontAwesomeIcon icon={faBoltLightning} className="h-3 w-3" />
            Fixable problem · save £96/yr
          </div>
          <p className="mt-1.5 text-sm font-medium leading-snug">
            You’re paying for Netflix and Disney+. Cancelling one saves about
            £96 a year.
          </p>
        </div>

        {/* Middle row: donut + insight */}
        <div className="mt-3 grid grid-cols-5 gap-3">
          {/* Interactive donut */}
          <div className="col-span-3 rounded-2xl border border-border p-3">
            <div className="flex items-center gap-3">
              <div className="relative h-24 w-24 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={SEGMENTS}
                      dataKey="value"
                      innerRadius={32}
                      outerRadius={46}
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
                          style={{
                            transition: 'opacity 150ms',
                            cursor: 'pointer',
                          }}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-[9px] font-medium text-muted-foreground">
                    {focus ? focus.label : 'Spent'}
                  </span>
                  <span className="text-xs font-bold tabular-nums text-foreground">
                    {gbp(focus ? focus.value : TOTAL)}
                  </span>
                </div>
              </div>
              <div className="flex flex-1 flex-col gap-1">
                {SEGMENTS.slice(0, 4).map((s, i) => (
                  <button
                    key={s.label}
                    type="button"
                    onMouseEnter={() => setActive(i)}
                    onMouseLeave={() => setActive(null)}
                    className={`flex items-center gap-1.5 rounded px-1 py-0.5 text-left text-[11px] transition-colors ${
                      active === i ? 'bg-muted' : ''
                    }`}
                  >
                    <span
                      className="h-1.5 w-1.5 shrink-0 rounded-full"
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
          </div>

          {/* Insight tile */}
          <div className="col-span-2 flex flex-col justify-between rounded-2xl border border-border p-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <FontAwesomeIcon icon={faLightbulb} className="h-3.5 w-3.5" />
            </span>
            <div>
              <p className="text-[11px] font-semibold text-foreground">
                Saving tip
              </p>
              <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
                You spent 18% less on eating out than last month.
              </p>
            </div>
          </div>
        </div>

        {/* Budget bar */}
        <div className="mt-3 rounded-2xl border border-border p-3.5">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 font-medium text-foreground">
              <FontAwesomeIcon
                icon={faArrowTrendUp}
                className="h-3 w-3 text-amber-500"
              />
              Groceries budget
            </span>
            <span className="tabular-nums text-muted-foreground">
              £486 of £500
            </span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-amber-500"
              style={{ width: '97%' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
