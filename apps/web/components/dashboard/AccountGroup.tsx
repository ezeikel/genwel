'use client';

import {
  faChevronDown,
  faCreditCard,
  faPiggyBank,
  faWallet,
} from '@fortawesome/pro-duotone-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useState } from 'react';
import type {
  AccountGroup as AccountGroupData,
  AccountKind,
} from '@/lib/accounts';
import { formatMoney } from '@/lib/accounts';

/**
 * A collapsible account bucket — Cash / Savings / Credit cards — showing the
 * group subtotal, expandable to the per-account breakdown behind it. This is the
 * "summary + drill-in" pattern from the money command centre.
 */

const KIND_ICON: Record<AccountKind, typeof faWallet> = {
  cash: faWallet,
  savings: faPiggyBank,
  credit: faCreditCard,
};

const KIND_ACCENT: Record<AccountKind, string> = {
  cash: 'text-primary bg-primary/10',
  savings: 'text-emerald-600 bg-emerald-100',
  credit: 'text-amber-600 bg-amber-100',
};

export default function AccountGroup({
  group,
  defaultOpen = true,
}: {
  group: AccountGroupData;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const isCredit = group.kind === 'credit';

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-muted/40"
      >
        <span
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${KIND_ACCENT[group.kind]}`}
        >
          <FontAwesomeIcon icon={KIND_ICON[group.kind]} className="h-4 w-4" />
        </span>
        <span className="font-semibold text-foreground">{group.label}</span>
        <span className="ml-auto flex items-center gap-3">
          <span className="text-lg font-bold tabular-nums text-foreground">
            {formatMoney(group.displayTotal)}
            {isCredit && (
              <span className="ml-1 text-xs font-normal text-muted-foreground">
                owed
              </span>
            )}
          </span>
          <FontAwesomeIcon
            icon={faChevronDown}
            className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </span>
      </button>

      {open && (
        <ul className="divide-y divide-border border-t border-border">
          {group.accounts.map((account) => (
            <li
              key={account.id}
              className="flex items-center gap-3 px-5 py-3.5"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  {account.displayName}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {account.providerName}
                </p>
              </div>
              <span className="ml-auto text-sm font-semibold tabular-nums text-foreground">
                {formatMoney(Math.abs(account.balance), account.currency)}
                {isCredit && (
                  <span className="ml-1 text-xs font-normal text-muted-foreground">
                    owed
                  </span>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
