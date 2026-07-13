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
 * cluster than a single card: net worth + trend, an interactive spending donut,
 * the Fixable Problem card (the money-saving find), a budget bar, and a smart
 * insight. Every visual responds to hover (donut segments, trend points, budget
 * bar, and the tiles lift) so the surface feels alive. Some figures are
 * illustrative placeholders until the real product UI is wired in here.
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
// Values in £k, paired with their month label for the hover tooltip.
const TREND = [
  { month: 'Jan', value: 18 },
  { month: 'Feb', value: 19.2 },
  { month: 'Mar', value: 18.6 },
  { month: 'Apr', value: 21 },
  { month: 'May', value: 22.4 },
  { month: 'Jun', value: 24.3 },
];

// Groceries budget figures (drive both the bar and its hover tooltip).
const BUDGET = { spent: 486, limit: 500 };

const gbp = (n: number) =>
  new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 0,
  }).format(n);

/**
 * Net-worth sparkline with hover-able points. Hovering a point highlights it
 * and shows a tooltip ("Jun · £24.3k"). Rendered on the dark net-worth panel.
 */
function TrendLine() {
  const [hover, setHover] = useState<number | null>(null);
  const w = 132;
  const h = 40;
  const values = TREND.map((t) => t.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pts = TREND.map((t, i) => {
    const x = (i / (TREND.length - 1)) * w;
    const y = h - ((t.value - min) / (max - min || 1)) * h;
    return { x, y, ...t };
  });
  const line = pts.map((p) => `${p.x},${p.y}`).join(' ');
  const area = `0,${h} ${line} ${w},${h}`;
  const focus = hover !== null ? pts[hover] : pts[pts.length - 1];

  return (
    <div className="relative">
      {/* Tooltip — positioned over the focused point, in px against the 132×40 box */}
      {hover !== null && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-md bg-background px-1.5 py-0.5 text-[9px] font-semibold tabular-nums text-foreground shadow-md ring-1 ring-border"
          style={{
            left: `${(focus.x / w) * 100}%`,
            top: `${(focus.y / h) * 100}%`,
            marginTop: '-4px',
          }}
        >
          {focus.month} · £{focus.value.toFixed(1)}k
        </div>
      )}
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
        {pts.map((p, i) => {
          const activePoint =
            hover === i || (hover === null && i === pts.length - 1);
          return (
            <g key={p.month}>
              {/* Visible dot on the active point */}
              <circle
                cx={p.x}
                cy={p.y}
                r={activePoint ? 3.5 : 0}
                fill="var(--primary)"
                style={{ transition: 'r 120ms' }}
              />
              {/* Wide invisible hit-target so hovering is forgiving */}
              <rect
                x={p.x - w / (TREND.length * 2)}
                y={0}
                width={w / TREND.length}
                height={h}
                fill="transparent"
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/**
 * Groceries budget bar with hover. Hovering the bar brightens it and reveals a
 * tooltip with what's left ("£14 left · 97% of £500").
 */
function BudgetBar() {
  const [hover, setHover] = useState(false);
  const pct = Math.round((BUDGET.spent / BUDGET.limit) * 100);
  const left = BUDGET.limit - BUDGET.spent;

  return (
    <div
      className={`mt-3 rounded-2xl border p-3.5 transition-all ${
        hover
          ? 'border-amber-300 shadow-md dark:border-amber-500/40'
          : 'border-border'
      }`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 font-medium text-foreground">
          <FontAwesomeIcon
            icon={faArrowTrendUp}
            className="h-3 w-3 text-amber-500"
          />
          Groceries budget
        </span>
        <span className="tabular-nums text-muted-foreground">
          {gbp(BUDGET.spent)} of {gbp(BUDGET.limit)}
        </span>
      </div>
      <div className="relative mt-2">
        {/* Tooltip — centred over the bar so it never clips the card edge
            (the fill is near-full, so anchoring to its leading edge would
            overflow). whitespace-nowrap keeps it on one line. */}
        {hover && (
          <div className="pointer-events-none absolute -top-1 left-1/2 z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-[10px] font-semibold tabular-nums text-background shadow-md">
            {gbp(left)} left · {pct}% of {gbp(BUDGET.limit)}
          </div>
        )}
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full rounded-full bg-amber-500 transition-all ${
              hover ? 'brightness-110' : ''
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
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
        <div className="mt-3 rounded-2xl bg-primary p-4 text-primary-foreground transition-transform hover:-translate-y-0.5">
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
          <div className="col-span-3 rounded-2xl border border-border p-3 transition-shadow hover:shadow-md">
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
          <div className="col-span-2 flex flex-col justify-between rounded-2xl border border-border p-3 transition-shadow hover:shadow-md">
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
        <BudgetBar />
      </div>
    </div>
  );
}
