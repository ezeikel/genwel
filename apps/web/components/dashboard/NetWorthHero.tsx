'use client';

import { faArrowTrendUp, faRotate } from '@fortawesome/pro-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { formatMoney } from '@/lib/accounts';

/**
 * Net-worth hero band — the "where do I sit" answer. One big signed figure
 * (assets minus card debt), the month delta, and an on-demand "Sync now" that
 * hits the worker so the numbers are to-the-day, not yesterday's snapshot.
 */

function timeAgo(date: Date | null): string {
  if (!date) return 'not synced yet';
  const secs = Math.floor((Date.now() - date.getTime()) / 1000);
  if (secs < 60) return 'just now';
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function NetWorthHero({
  netWorth,
  monthDelta,
  accountCount,
  lastSyncedAt,
}: {
  netWorth: number;
  monthDelta: number | null;
  accountCount: number;
  lastSyncedAt: string | null; // ISO string (serialisable from server)
}) {
  const router = useRouter();
  const [syncing, setSyncing] = useState(false);
  const syncedDate = lastSyncedAt ? new Date(lastSyncedAt) : null;

  // Manual "Sync now" — the layout's SyncTrigger already runs one sync on mount;
  // this gives the user an explicit, visible way to pull to-the-day data.
  const runSync = async () => {
    if (syncing) return;
    setSyncing(true);
    try {
      await fetch('/api/banking/sync', { method: 'POST' });
      // give the worker a moment to drain, then pull fresh data
      await new Promise((r) => setTimeout(r, 6000));
      router.refresh();
    } catch {
      // non-critical; freshness label just stays as-is
    } finally {
      setSyncing(false);
    }
  };

  const deltaPositive = (monthDelta ?? 0) >= 0;

  return (
    <div className="relative overflow-hidden rounded-3xl bg-primary p-6 text-primary-foreground shadow-lg md:p-8">
      {/* soft glow */}
      <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-accent/20 blur-3xl" />

      <div className="relative flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-primary-foreground/70">
            Net worth · {accountCount}{' '}
            {accountCount === 1 ? 'account' : 'accounts'}
          </p>
          <p className="mt-1 text-4xl font-bold tracking-tight tabular-nums md:text-5xl">
            {formatMoney(netWorth)}
          </p>
          {monthDelta !== null && (
            <p
              className={`mt-2 flex items-center gap-1.5 text-sm font-medium ${
                deltaPositive ? 'text-emerald-300' : 'text-amber-300'
              }`}
            >
              <FontAwesomeIcon icon={faArrowTrendUp} className="h-3.5 w-3.5" />
              {deltaPositive ? '+' : ''}
              {formatMoney(monthDelta)} this month
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={runSync}
          disabled={syncing}
          className="flex items-center gap-2 rounded-full bg-primary-foreground/10 px-4 py-2 text-sm font-medium backdrop-blur transition-colors hover:bg-primary-foreground/20 disabled:opacity-70"
        >
          <FontAwesomeIcon
            icon={faRotate}
            className={`h-3.5 w-3.5 ${syncing ? 'animate-spin' : ''}`}
          />
          {syncing ? 'Syncing…' : 'Sync now'}
        </button>
      </div>

      <p className="relative mt-4 text-xs text-primary-foreground/60">
        Updated {syncing ? 'now' : timeAgo(syncedDate)}
      </p>
    </div>
  );
}
