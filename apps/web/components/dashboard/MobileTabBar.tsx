'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { isActiveRoute, MOBILE_TABS } from '@/components/dashboard/nav-items';

/**
 * Floating glass bottom tab bar (below lg). A rounded translucent pill that
 * floats above the content with a backdrop blur and soft shadow — the same
 * look as the Titrra / Chunky Crayon mobile tab bars, which the Genwel mobile
 * app will also use. Five primary destinations; active = brand teal, inactive
 * = muted. Desktop uses the sidebar; this is hidden there.
 */
export default function MobileTabBar() {
  const pathname = usePathname();

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] lg:hidden">
      <nav className="pointer-events-auto flex w-full max-w-md items-stretch justify-around gap-1 rounded-[28px] border border-foreground/[0.06] bg-card/70 px-2 py-2 shadow-[0_12px_28px_-8px_rgba(20,32,31,0.18)] backdrop-blur-xl">
        {MOBILE_TABS.map((item) => {
          const active = isActiveRoute(pathname, item.href);
          const label = item.mobileName ?? item.name;
          return (
            <Link
              key={item.name}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              aria-label={item.name}
              className={`group flex flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl py-1 text-[10px] font-semibold tracking-tight transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45 ${
                active ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <span
                className={`flex h-8 w-11 items-center justify-center rounded-[13px] transition-colors ${
                  active
                    ? 'bg-primary/10'
                    : 'group-hover:bg-muted/70 group-focus-visible:bg-muted/70'
                }`}
              >
                <FontAwesomeIcon icon={item.icon} size="lg" />
              </span>
              <span className="max-w-full truncate px-0.5">{label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
