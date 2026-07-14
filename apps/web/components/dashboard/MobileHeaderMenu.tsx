'use client';

import {
  faBoltLightning,
  faChartPie,
  faLightbulb,
  faSignOut,
  faXmark,
} from '@fortawesome/pro-light-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as Dialog from '@radix-ui/react-dialog';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { useState } from 'react';
import { displayName, initials } from '@/lib/user-display';

/**
 * Mobile account menu. The header shows an avatar (Emma-style: logo left,
 * avatar right); tapping it opens a full-screen modal — not a dropdown — with
 * an X to close. The floating tab bar carries the five primary sections; this
 * modal carries the rest (Budgets, Insights, upgrade/Pro, profile, sign out)
 * so mobile users reach everything the desktop sidebar offers.
 */
export default function MobileHeaderMenu({
  user,
  isPro,
}: {
  user: { name?: string | null; email?: string | null; image?: string | null };
  isPro: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          aria-label="Account menu"
          className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 outline-none ring-primary/30 focus-visible:ring-2"
        >
          {user.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.image}
              alt=""
              className="h-9 w-9 rounded-full object-cover"
            />
          ) : (
            <span className="text-xs font-semibold text-primary">
              {initials(user.name, user.email)}
            </span>
          )}
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed inset-0 z-50 flex flex-col bg-card outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-bottom-2"
        >
          {/* Top bar: title + close X */}
          <div className="flex h-14 items-center justify-between border-b border-border px-4">
            <Dialog.Title className="text-base font-semibold text-foreground">
              Account
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="Close"
                className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <FontAwesomeIcon icon={faXmark} className="h-6 w-6" />
              </button>
            </Dialog.Close>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {/* Identity */}
            <div className="flex items-center gap-4 rounded-2xl bg-muted/50 p-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10">
                {user.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.image}
                    alt=""
                    className="h-14 w-14 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-lg font-semibold text-primary">
                    {initials(user.name, user.email)}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-semibold text-foreground">
                  {displayName(user.name, user.email)}
                </p>
                <p className="truncate text-sm text-muted-foreground">
                  {user.email}
                </p>
              </div>
            </div>

            {/* Upgrade / Pro */}
            <div className="mt-4">
              {isPro ? (
                <div className="flex items-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground">
                  <FontAwesomeIcon icon={faBoltLightning} className="h-5 w-5" />
                  Genwel Pro
                </div>
              ) : (
                <Link
                  href="/pricing"
                  onClick={() => setOpen(false)}
                  className="block rounded-2xl bg-primary p-4 text-primary-foreground"
                >
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <FontAwesomeIcon
                      icon={faBoltLightning}
                      className="h-5 w-5"
                    />
                    Upgrade to Pro
                  </div>
                  <p className="mt-1 text-xs text-primary-foreground/80">
                    Unlimited banks, smart insights & Ask Genwel — 7 days free.
                  </p>
                </Link>
              )}
            </div>

            {/* Secondary nav not in the tab bar */}
            <nav className="mt-4 space-y-1">
              <Link
                href="/dashboard/budgets"
                onClick={() => setOpen(false)}
                className="flex items-center gap-4 rounded-2xl px-4 py-3.5 text-base font-medium text-foreground transition-colors hover:bg-muted"
              >
                <FontAwesomeIcon icon={faChartPie} className="h-6 w-6" />
                Budgets
              </Link>
              <Link
                href="/dashboard/insights"
                onClick={() => setOpen(false)}
                className="flex items-center gap-4 rounded-2xl px-4 py-3.5 text-base font-medium text-foreground transition-colors hover:bg-muted"
              >
                <FontAwesomeIcon icon={faLightbulb} className="h-6 w-6" />
                Insights
              </Link>
            </nav>

            {/* Sign out */}
            <div className="mt-4 border-t border-border pt-4">
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: '/' })}
                className="flex w-full items-center gap-4 rounded-2xl px-4 py-3.5 text-base text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <FontAwesomeIcon icon={faSignOut} className="h-6 w-6" />
                Sign out
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
