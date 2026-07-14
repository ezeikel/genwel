'use client';

import { faBoltLightning, faSignOut } from '@fortawesome/pro-light-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { isActiveRoute, NAV_ITEMS } from '@/components/dashboard/nav-items';
import Logo from '@/components/Logo';
import { displayName, initials } from '@/lib/user-display';

interface DashboardSidebarProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  isPro: boolean;
}

/**
 * Desktop-only sidebar (lg and up). On mobile, navigation lives in the bottom
 * tab bar (MobileTabBar) — the finance-app standard, thumb-reachable.
 */
export default function DashboardSidebar({
  user,
  isPro,
}: DashboardSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-border bg-card lg:flex">
      <div className="flex h-full w-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center border-b border-border px-6">
          <Link href="/" aria-label="Genwel home">
            <Logo size={28} />
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {NAV_ITEMS.map((item) => {
            const active = isActiveRoute(pathname, item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-muted text-foreground'
                    : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'
                }`}
              >
                <FontAwesomeIcon icon={item.icon} className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Upgrade CTA (free) / Pro badge */}
        <div className="px-3 pb-2">
          {isPro ? (
            <div className="flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground">
              <FontAwesomeIcon icon={faBoltLightning} className="h-4 w-4" />
              Genwel Pro
            </div>
          ) : (
            <Link
              href="/pricing"
              className="block rounded-2xl bg-primary p-4 text-primary-foreground transition-transform hover:scale-[1.02]"
            >
              <div className="flex items-center gap-2 text-sm font-semibold">
                <FontAwesomeIcon icon={faBoltLightning} className="h-4 w-4" />
                Upgrade to Pro
              </div>
              <p className="mt-1 text-xs text-primary-foreground/80">
                Unlimited banks, smart insights & Ask Genwel — 7 days free.
              </p>
            </Link>
          )}
        </div>

        {/* User section */}
        <div className="border-t border-border p-4">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10">
              {user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.image}
                  alt=""
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                <span className="text-sm font-semibold text-primary">
                  {initials(user.name, user.email)}
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {displayName(user.name, user.email)}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {user.email}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: '/' })}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
          >
            <FontAwesomeIcon icon={faSignOut} className="h-4 w-4" />
            Sign out
          </button>
          {/* logo.dev free-tier attribution (required for commercial use). */}
          <p className="mt-3 px-3 text-[10px] text-muted-foreground/70">
            Logos by{' '}
            <a
              href="https://logo.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-muted-foreground"
            >
              Logo.dev
            </a>
          </p>
        </div>
      </div>
    </aside>
  );
}
