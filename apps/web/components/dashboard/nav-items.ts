import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import {
  faArrowsRotate,
  faChartPie,
  faCommentDots,
  faCreditCard,
  faHome,
  faLightbulb,
  faReceipt,
} from '@fortawesome/pro-light-svg-icons';

export type NavItem = { name: string; href: string; icon: IconDefinition };

/** Every dashboard nav destination (used by the desktop sidebar). */
export const NAV_ITEMS: NavItem[] = [
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

/**
 * The five tabs shown in the floating glass bottom bar on mobile. Five is the
 * finance-app norm (Emma/Monzo/Titrra) and what the Genwel mobile app will use.
 * Budgets + Insights stay in the desktop sidebar and are reachable from the
 * Overview page's own cards.
 */
export const MOBILE_TABS: NavItem[] = [
  NAV_ITEMS[0], // Overview
  NAV_ITEMS[1], // Accounts
  NAV_ITEMS[3], // Transactions
  NAV_ITEMS[4], // Subscriptions
  NAV_ITEMS[6], // Ask Genwel
];

/** Is a nav item the active route? (Overview is exact; others are prefix.) */
export function isActiveRoute(pathname: string, href: string): boolean {
  return (
    pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
  );
}
