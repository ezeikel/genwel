'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  type AnalyticsConsent,
  OPEN_COOKIE_SETTINGS_EVENT,
  openCookieSettings,
  readAnalyticsConsent,
  writeAnalyticsConsent,
} from '@/lib/analytics-consent';
import { Button } from './ui/button';

export function CookieSettingsButton({ className }: { className?: string }) {
  return (
    <button type="button" className={className} onClick={openCookieSettings}>
      Cookie settings
    </button>
  );
}

export default function CookieConsent() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(readAnalyticsConsent() === null);

    const handleOpenSettings = () => setOpen(true);
    window.addEventListener(OPEN_COOKIE_SETTINGS_EVENT, handleOpenSettings);
    return () =>
      window.removeEventListener(
        OPEN_COOKIE_SETTINGS_EVENT,
        handleOpenSettings,
      );
  }, []);

  const saveChoice = (choice: AnalyticsConsent) => {
    writeAnalyticsConsent(choice);
    setOpen(false);
  };

  if (!open) return null;

  return (
    <aside
      aria-label="Cookie preferences"
      className="fixed inset-x-4 bottom-4 z-[100] mx-auto max-w-3xl rounded-2xl border border-border bg-background p-5 shadow-2xl md:p-6"
    >
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="max-w-xl">
          <h2 className="font-semibold text-foreground">
            Your privacy choices
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            We use essential storage to keep you signed in. With your
            permission, we also use PostHog analytics to understand and improve
            Genwel. You can change this choice at any time.{' '}
            <Link href="/cookies" className="underline hover:text-foreground">
              Read our cookie policy
            </Link>
            .
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            onClick={() => saveChoice('essential')}
          >
            Essential only
          </Button>
          <Button type="button" onClick={() => saveChoice('analytics')}>
            Accept analytics
          </Button>
        </div>
      </div>
    </aside>
  );
}
