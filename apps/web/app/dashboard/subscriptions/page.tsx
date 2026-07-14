import {
  faArrowsRotate,
  faArrowUp,
  faLayerGroup,
} from '@fortawesome/pro-duotone-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { db } from '@genwel/db';
import { Suspense } from 'react';
import { getSubscriptionReport } from '@/actions/subscriptions';
import { auth } from '@/auth';
import EmptyState from '@/components/dashboard/EmptyState';
import SubscriptionRow from '@/components/dashboard/subscriptions/SubscriptionRow';
import SubscriptionsInsight from '@/components/dashboard/subscriptions/SubscriptionsInsight';
import { formatMoney } from '@/lib/accounts';
import type { Cadence } from '@/lib/subscriptions';

const CADENCE_ORDER: Cadence[] = ['monthly', 'weekly', 'yearly', 'irregular'];
const CADENCE_HEADING: Record<Cadence, string> = {
  monthly: 'Monthly',
  weekly: 'Weekly',
  yearly: 'Yearly',
  irregular: 'Other recurring',
};

export default async function SubscriptionsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const result = await getSubscriptionReport();
  if ('error' in result) return null;
  const { report } = result;

  if (report.subscriptions.length === 0) {
    // Distinguish "no accounts" from "accounts but nothing recurring found".
    const accountCount = await db.bankAccount.count({
      where: { connection: { userId: session.user.id } },
    });
    return (
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-8 text-2xl font-bold text-foreground">
          Subscriptions
        </h1>
        {accountCount === 0 ? (
          <EmptyState />
        ) : (
          <div className="rounded-2xl border border-border bg-card p-12 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <FontAwesomeIcon
                icon={faArrowsRotate}
                className="h-8 w-8 text-muted-foreground"
              />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-foreground">
              No recurring payments spotted yet
            </h3>
            <p className="mx-auto max-w-md text-muted-foreground">
              Genwel finds subscriptions and bills once they’ve charged a couple
              of times. As more transactions come in, they’ll show up here with
              renewal dates and price-rise alerts.
            </p>
          </div>
        )}
      </div>
    );
  }

  // Group by cadence for the list.
  const byCadence = new Map<Cadence, typeof report.subscriptions>();
  for (const sub of report.subscriptions) {
    const list = byCadence.get(sub.cadence) ?? [];
    list.push(sub);
    byCadence.set(sub.cadence, list);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Subscriptions</h1>

      {/* Total hero */}
      <div className="relative overflow-hidden rounded-3xl bg-primary p-6 text-primary-foreground shadow-lg md:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-accent/20 blur-3xl" />
        <p className="text-sm font-medium text-primary-foreground/70">
          {report.subscriptions.length} recurring payments
        </p>
        <p className="mt-1 text-4xl font-bold tracking-tight tabular-nums md:text-5xl">
          {formatMoney(report.monthlyTotal, 'GBP', { decimals: true })}
          <span className="ml-2 text-lg font-medium text-primary-foreground/70">
            /mo
          </span>
        </p>
        <p className="mt-1 text-sm text-primary-foreground/70">
          {formatMoney(report.yearlyTotal)} a year
        </p>
      </div>

      {/* AI "what to cut" — Pro-gated, streams in */}
      <Suspense fallback={null}>
        <SubscriptionsInsight userId={session.user.id} report={report} />
      </Suspense>

      {/* Duplicate/overlap callouts */}
      {report.duplicates.map((dup) => (
        <div
          key={dup.label}
          className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
            <FontAwesomeIcon icon={faLayerGroup} className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-semibold text-amber-900">
              You have {dup.subscriptions.length} {dup.label} services
            </p>
            <p className="text-sm text-amber-800">
              {dup.subscriptions.map((s) => s.name).join(', ')}. Cutting the
              extras could save{' '}
              <span className="font-semibold">
                {formatMoney(dup.potentialMonthlySaving, 'GBP', {
                  decimals: true,
                })}
                /mo
              </span>
              .
            </p>
          </div>
        </div>
      ))}

      {/* Price-rise callouts */}
      {report.subscriptions.some((s) => s.priceRise) && (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600">
            <FontAwesomeIcon icon={faArrowUp} className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-semibold text-rose-900">Price rises</p>
            <p className="text-sm text-rose-800">
              {report.subscriptions
                .filter((s) => s.priceRise)
                .map(
                  (s) =>
                    `${s.name} went up ${formatMoney(s.priceRise!.delta, 'GBP', { decimals: true })}`,
                )
                .join(' · ')}
              .
            </p>
          </div>
        </div>
      )}

      {/* The list, grouped by cadence */}
      <div className="space-y-6">
        {CADENCE_ORDER.filter((c) => byCadence.has(c)).map((cadence) => (
          <div key={cadence}>
            <h2 className="mb-2 px-1 text-sm font-semibold text-muted-foreground">
              {CADENCE_HEADING[cadence]}
            </h2>
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              <div className="divide-y divide-border">
                {byCadence.get(cadence)?.map((sub) => (
                  <SubscriptionRow key={sub.key} sub={sub} />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
