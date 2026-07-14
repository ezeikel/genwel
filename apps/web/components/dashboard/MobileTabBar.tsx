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
          return (
            <Link
              key={item.name}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={`flex flex-1 flex-col items-center justify-center gap-1 rounded-2xl py-1.5 text-[11px] font-semibold tracking-tight transition-colors ${
                active ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              {/* Use the size prop — FA sizes off font-size (its CSS forces
                  height:1em), so h-/w- utilities collapse to the parent's small
                  label font-size. The size prop is the reliable lever. */}
              <FontAwesomeIcon icon={item.icon} size="xl" />
              <span className="max-w-full truncate px-0.5">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
