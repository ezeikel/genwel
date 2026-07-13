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
 * circle otherwise. No rainbow of 16 hues — spend is a soft neutral/teal, income
 * is green. Amounts and merchant names stay the focus.
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
  const [failed, setFailed] = useState(false);
  const showLogo = domain && !failed;

  return (
    <span
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-full ring-1 ring-border/60"
      style={{ width: size, height: size }}
    >
      {showLogo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`/api/merchant-logo?domain=${encodeURIComponent(domain)}`}
          alt=""
          width={size}
          height={size}
          className="h-full w-full object-cover"
          loading="lazy"
          onError={() => setFailed(true)}
        />
      ) : (
        <span
          className={`flex h-full w-full items-center justify-center ${fallbackTint(category)}`}
        >
          <FontAwesomeIcon
            icon={getCategoryIcon(category)}
            style={{ width: size * 0.4, height: size * 0.4 }}
          />
        </span>
      )}
    </span>
  );
}
