'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';

/**
 * Fire-and-forget trigger that kicks off a background sync + categorize when
 * the dashboard mounts, then refreshes the route once so freshly-synced data
 * shows up. Renders nothing. Never blocks page render — all heavy work happens
 * server-side in `after()` behind /api/banking/sync.
 */
export default function SyncTrigger() {
  const router = useRouter();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    let cancelled = false;

    fetch('/api/banking/sync', { method: 'POST' })
      .then((res) => {
        if (!res.ok || cancelled) return;
        // Give the background sync a moment, then pull fresh server data once.
        setTimeout(() => {
          if (!cancelled) router.refresh();
        }, 6000);
      })
      .catch(() => {
        // Non-critical — the next visit will retry.
      });

    return () => {
      cancelled = true;
    };
  }, [router]);

  return null;
}
