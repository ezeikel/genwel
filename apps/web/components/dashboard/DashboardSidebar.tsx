'use client';

import {
  faBars,
  faBoltLightning,
  faChartPie,
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
  { name: 'Insights', href: '/dashboard/insights', icon: faLightbulb },
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
          className="p-2 bg-white rounded-lg shadow-md"
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
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center h-16 px-6 border-b border-gray-200">
            <Link href="/" className="text-xl font-bold text-gray-900">
              Genwel
            </Link>
            <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
              Alpha
            </span>
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
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
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
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium">
                <FontAwesomeIcon icon={faBoltLightning} className="w-4 h-4" />
                Genwel Pro
              </div>
            ) : (
              <Link
                href="/pricing"
                onClick={() => setMobileMenuOpen(false)}
                className="block rounded-xl bg-gradient-to-br from-gray-900 to-gray-700 p-4 text-white transition-transform hover:scale-[1.02]"
              >
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <FontAwesomeIcon icon={faBoltLightning} className="w-4 h-4" />
                  Upgrade to Pro
                </div>
                <p className="mt-1 text-xs text-gray-300">
                  Unlimited banks, AI insights & Ask Genwel — 7 days free.
                </p>
              </Link>
            )}
          </div>

          {/* User section */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                {user.image ? (
                  <img
                    src={user.image}
                    alt=""
                    className="w-10 h-10 rounded-full"
                  />
                ) : (
                  <span className="text-sm font-medium text-gray-600">
                    {user.name?.[0] || user.email?.[0] || '?'}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user.name || 'User'}
                </p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <FontAwesomeIcon icon={faSignOut} className="w-4 h-4" />
              Sign out
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
