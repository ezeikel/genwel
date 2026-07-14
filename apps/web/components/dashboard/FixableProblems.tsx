import {
  faArrowTrendUp,
  faCircleCheck,
  faLayerGroup,
  faLock,
  faSterlingSign,
  faTriangleExclamation,
} from '@fortawesome/pro-light-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Link from 'next/link';
import { getFixableProblems } from '@/actions/fixable-problems';
import { formatCurrency } from '@/lib/budget-utils';

const kindConfig = {
  duplicate_subscription: {
    icon: faLayerGroup,
    color: 'bg-primary/10 text-primary',
  },
  price_increase: {
    icon: faArrowTrendUp,
    color: 'bg-amber-100 text-amber-600',
  },
  over_budget: {
    icon: faTriangleExclamation,
    color: 'bg-rose-100 text-rose-600',
  },
} as const;

const severityBadge = {
  high: 'bg-rose-100 text-rose-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-muted text-muted-foreground',
} as const;

/**
 * The Genwel wedge card. Surfaces ranked "fixable problems" (duplicate subs,
 * price rises, overspend) with conservative £ savings. Free users get a
 * one-problem teaser + upgrade prompt; Pro users get the full list.
 */
export default async function FixableProblems() {
  const { problems, totalSaving, locked, lockedCount } =
    await getFixableProblems();

  if (problems.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <FontAwesomeIcon icon={faCircleCheck} className="h-4 w-4" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground">
              No fixable problems found
            </h2>
            <p className="text-sm text-muted-foreground">
              We&apos;ll flag duplicate subscriptions, price rises and overspend
              here as we spot them.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between gap-4 border-b border-border p-5">
        <div>
          <h2 className="font-semibold text-foreground">
            Your biggest fixable problems
          </h2>
          <p className="text-sm text-muted-foreground">
            {problems.length} thing{problems.length === 1 ? '' : 's'} worth a
            look
          </p>
        </div>
        {totalSaving > 0 && (
          <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-right">
            <FontAwesomeIcon
              icon={faSterlingSign}
              className="h-4 w-4 text-emerald-600"
            />
            <div>
              <p className="text-xs text-emerald-700">Potential savings</p>
              <p className="font-bold text-emerald-800">
                {formatCurrency(totalSaving)}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="divide-y divide-border">
        {problems.slice(0, 5).map((problem) => {
          const config = kindConfig[problem.kind];
          return (
            <div key={problem.id} className="flex items-start gap-4 p-4">
              <div
                className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${config.color}`}
              >
                <FontAwesomeIcon icon={config.icon} className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-foreground">{problem.title}</p>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${severityBadge[problem.severity]}`}
                  >
                    {problem.severity}
                  </span>
                </div>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {problem.detail}
                </p>
              </div>
              {problem.estimatedSaving > 0 && (
                <div className="flex-shrink-0 text-right">
                  <p className="text-sm font-semibold text-emerald-700">
                    {formatCurrency(problem.estimatedSaving)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {problem.kind === 'over_budget' ? 'this period' : 'a year'}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Free tier: prompt to unlock the rest */}
      {locked && lockedCount > 0 && (
        <Link
          href="/pricing"
          className="flex items-center justify-between gap-3 border-t border-border bg-muted/40 px-5 py-3.5 transition-colors hover:bg-muted"
        >
          <span className="flex items-center gap-2 text-sm font-medium text-foreground">
            <FontAwesomeIcon
              icon={faLock}
              className="h-3.5 w-3.5 text-primary"
            />
            {lockedCount} more fixable problem{lockedCount === 1 ? '' : 's'}{' '}
            found
          </span>
          <span className="text-sm font-semibold text-primary">
            Upgrade to see all →
          </span>
        </Link>
      )}

      <p className="border-t border-border bg-muted/40 px-5 py-3 text-xs text-muted-foreground">
        Estimates based on your transaction history and may not be exact. Not
        regulated financial advice.
      </p>
    </div>
  );
}
