'use client';

import {
  faArrowsRotate,
  faBars,
  faBoltLightning,
  faChartPie,
  faCommentDots,
  faCreditCard,
  faHome,
  faLightbulb,
  faReceipt,
  faSignOut,
  faXmark,
} from '@fortawesome/pro-light-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useState } from 'react';
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

const navigation = [
  { name: 'Overview', href: '/dashboard', icon: faHome },
  { name: 'Accounts', href: '/dashboard/accounts', icon: faCreditCard },
  { name: 'Budgets', href: '/dashboard/budgets', icon: faChartPie },
  { name: 'Transactions', href: '/dashboard/transactions', icon: faReceipt },
  {
    name: 'Subscriptions',
    href: '/dashboard/subscriptions',
    icon: faArrowsRotate,
  },
  { name: 'Insights', href: '/dashboard/insights', icon: faLightbulb },
  { name: 'Ask Genwel', href: '/dashboard/ask', icon: faCommentDots },
];

export default function DashboardSidebar({
  user,
  isPro,
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 bg-card rounded-lg shadow-md"
        >
          <FontAwesomeIcon
            icon={mobileMenuOpen ? faXmark : faBars}
            className="w-5 h-5"
          />
        </button>
      </div>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-foreground/50 z-40"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center h-16 px-6 border-b border-border">
            <Link href="/" aria-label="Genwel home">
              <Logo size={28} />
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1">
            {navigation.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== '/dashboard' && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-muted text-foreground'
                      : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'
                  }`}
                >
                  <FontAwesomeIcon icon={item.icon} className="w-5 h-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Upgrade CTA (free users) / Pro badge */}
          <div className="px-3 pb-2">
            {isPro ? (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium">
                <FontAwesomeIcon icon={faBoltLightning} className="w-4 h-4" />
                Genwel Pro
              </div>
            ) : (
              <Link
                href="/pricing"
                onClick={() => setMobileMenuOpen(false)}
                className="block rounded-2xl bg-primary p-4 text-primary-foreground transition-transform hover:scale-[1.02]"
              >
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <FontAwesomeIcon icon={faBoltLightning} className="w-4 h-4" />
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
            <div className="flex items-center gap-3 mb-4">
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
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {displayName(user.name, user.email)}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user.email}
                </p>
              </div>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/40 rounded-lg transition-colors"
            >
              <FontAwesomeIcon icon={faSignOut} className="w-4 h-4" />
              Sign out
            </button>
            {/* logo.dev free-tier attribution (required for commercial use) —
                kept present but unobtrusive at the base of the sidebar. */}
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
    </>
  );
}
