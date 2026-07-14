import {
  faArrowRight,
  faArrowsRotate,
} from '@fortawesome/pro-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Link from 'next/link';
import { formatMoney } from '@/lib/accounts';
import type { SubscriptionReport } from '@/lib/subscriptions';

/**
 * Overview summary card for subscriptions — the "front door" surfacing. Shows
 * the monthly total and the single most useful highlight (a soon renewal or the
 * biggest overlap to cut), linking to the full Subscriptions page.
 */

export default function SubscriptionsCard({
  report,
}: {
  report: SubscriptionReport;
}) {
  if (report.subscriptions.length === 0) return null;

  // Pick the most useful one-liner highlight.
  let highlight: string | null = null;
  const soonest = report.upcoming[0];
  const biggestDupe = report.duplicates[0];
  if (soonest?.nextRenewal) {
    const days = Math.round(
      (soonest.nextRenewal.getTime() - Date.now()) / (24 * 60 * 60 * 1000),
    );
    highlight = `${soonest.name} renews ${days <= 0 ? 'today' : `in ${days} day${days === 1 ? '' : 's'}`}`;
  } else if (biggestDupe) {
    highlight = `${biggestDupe.subscriptions.length} ${biggestDupe.label} — save ${formatMoney(biggestDupe.potentialMonthlySaving, 'GBP', { decimals: true })}/mo`;
  }

  return (
    <Link
      href="/dashboard/subscriptions"
      className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm transition-colors hover:bg-muted/40"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <FontAwesomeIcon icon={faArrowsRotate} className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-muted-foreground">
          Subscriptions · {report.subscriptions.length} recurring
        </p>
        <p className="text-lg font-bold tabular-nums text-foreground">
          {formatMoney(report.monthlyTotal, 'GBP', { decimals: true })}
          <span className="text-sm font-normal text-muted-foreground">/mo</span>
        </p>
        {highlight && (
          <p className="truncate text-xs text-muted-foreground">{highlight}</p>
        )}
      </div>
      <FontAwesomeIcon
        icon={faArrowRight}
        className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
      />
    </Link>
  );
}
