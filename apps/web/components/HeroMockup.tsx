import {
  faBoltLightning,
  faCircleCheck,
} from '@fortawesome/pro-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

/**
 * Hero product mockup — a real Genwel dashboard rendered in the site's design
 * tokens (crisp at any DPI, theme-aware) rather than a screenshot/placeholder.
 * Leads with the things that set Genwel apart: net worth, the Fixable Problem
 * card (money-saving finds), and a spending donut.
 */

// Spending donut segments (category → % of month, colour token).
const SEGMENTS = [
  { label: 'Groceries', value: 32, color: 'var(--primary)' },
  { label: 'Eating out', value: 24, color: 'var(--accent)' },
  { label: 'Bills', value: 21, color: 'oklch(0.6 0.12 210)' },
  { label: 'Shopping', value: 14, color: 'oklch(0.7 0.14 300)' },
  { label: 'Other', value: 9, color: 'oklch(0.75 0.02 180)' },
];

function Donut() {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  return (
    <svg viewBox="0 0 120 120" className="h-28 w-28 -rotate-90">
      <circle
        cx="60"
        cy="60"
        r={radius}
        fill="none"
        stroke="var(--muted)"
        strokeWidth="14"
      />
      {SEGMENTS.map((s) => {
        const len = (s.value / 100) * circumference;
        const dash = `${len} ${circumference - len}`;
        const el = (
          <circle
            key={s.label}
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke={s.color}
            strokeWidth="14"
            strokeDasharray={dash}
            strokeDashoffset={-offset}
            strokeLinecap="butt"
          />
        );
        offset += len;
        return el;
      })}
    </svg>
  );
}

export default function HeroMockup() {
  return (
    <div className="relative mx-auto w-full max-w-sm">
      {/* soft glow */}
      <div className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-primary/10 blur-3xl" />

      <div className="flex flex-col gap-4 rounded-3xl border border-border bg-card p-5 shadow-2xl">
        {/* Net worth header */}
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

        {/* Fixable Problem card — the differentiator */}
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

        {/* Spending donut + legend */}
        <div className="flex items-center gap-4 rounded-2xl border border-border p-4">
          <Donut />
          <div className="flex flex-1 flex-col gap-2">
            <p className="text-xs font-medium text-muted-foreground">
              This month
            </p>
            {SEGMENTS.slice(0, 4).map((s) => (
              <div
                key={s.label}
                className="flex items-center gap-2 text-xs text-foreground/80"
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: s.color }}
                />
                {s.label}
                <span className="ml-auto font-medium tabular-nums">
                  {s.value}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recurring row */}
        <div className="flex items-center justify-between rounded-2xl border border-border p-3.5">
          <div className="flex items-center gap-3">
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
    </div>
  );
}
