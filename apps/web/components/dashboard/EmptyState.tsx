'use client';

import { faBuildingColumns } from '@fortawesome/pro-light-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import ConnectBankButton from './ConnectBankButton';

export default function EmptyState() {
  return (
    <div className="bg-card rounded-2xl p-12 text-center shadow-sm border border-border">
      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
        <FontAwesomeIcon
          icon={faBuildingColumns}
          className="w-8 h-8 text-muted-foreground/70"
        />
      </div>

      <h2 className="text-xl font-semibold text-foreground mb-2">
        Connect your bank account
      </h2>

      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
        Link your bank account to see your balances, transactions, and spending
        insights all in one place.
      </p>

      <ConnectBankButton />

      <div className="mt-8 pt-8 border-t border-border">
        <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground/70">
          <div className="flex items-center gap-2">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            Bank-level security
          </div>
          <div className="flex items-center gap-2">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
            Read-only access
          </div>
          <div className="flex items-center gap-2">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
            Secure Open Banking
          </div>
        </div>
      </div>
    </div>
  );
}
