'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { SpendingCategory } from '@genwel/db';
import { useState } from 'react';
import { getCategoryIcon } from '@/lib/budget-utils';
import { merchantDomain } from '@/lib/merchant-logos';

/**
 * Transaction row icon — the real-bank treatment.
 *
 * Shows the merchant's brand logo (via our proxied /api/merchant-logo route)
 * where we can resolve one, and falls back to a single calm, on-brand category
 * circle otherwise. No rainbow of 16 hues.
 *
 * Bulletproofing: the fallback circle ALWAYS renders underneath. The logo <img>
 * overlays it and only becomes visible once it has genuinely loaded (onLoad).
 * If the logo 404s / errors / is missing (e.g. the LOGO_DEV_TOKEN isn't set),
 * the <img> stays hidden and the circle shows through — so a failed logo can
 * never leave a broken-image placeholder on screen.
 */

// Calm, restrained fallback tints. Spend categories share one soft treatment;
// only money-in (income) gets a distinct green, so colour carries meaning.
function fallbackTint(category: SpendingCategory): string {
  switch (category) {
    case 'INCOME':
      return 'bg-emerald-100 text-emerald-600';
    case 'SAVINGS':
      return 'bg-primary/10 text-primary';
    case 'FEES':
      return 'bg-rose-100 text-rose-500';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

export default function MerchantIcon({
  merchant,
  category,
  size = 40,
}: {
  merchant: string;
  category: SpendingCategory;
  size?: number;
}) {
  const domain = merchantDomain(merchant);
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);
  const tryLogo = Boolean(domain) && !errored;

  return (
    <span
      className="relative flex shrink-0 items-center justify-center overflow-hidden rounded-full ring-1 ring-border/60"
      style={{ width: size, height: size }}
    >
      {/* Fallback circle — always present underneath */}
      <span
        className={`flex h-full w-full items-center justify-center ${fallbackTint(category)}`}
      >
        <FontAwesomeIcon
          icon={getCategoryIcon(category)}
          style={{ width: size * 0.4, height: size * 0.4 }}
        />
      </span>

      {/* Logo overlays the circle, only visible once it actually loads */}
      {tryLogo && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`/api/merchant-logo?domain=${encodeURIComponent(domain as string)}`}
          alt=""
          className={`absolute inset-0 h-full w-full bg-white object-contain transition-opacity ${
            loaded ? 'opacity-100' : 'opacity-0'
          }`}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          onError={() => setErrored(true)}
        />
      )}
    </span>
  );
}
