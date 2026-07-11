'use client';

import { faSpinner } from '@fortawesome/pro-light-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useState } from 'react';
import { createProCheckout } from '@/actions/billing';
import { useAnalytics } from '@/utils/analytics-client';

interface UpgradeButtonProps {
  billingPeriod: 'monthly' | 'annual';
  label?: string;
  className?: string;
}

export default function UpgradeButton({
  billingPeriod,
  label = 'Start 7-day free trial',
  className = '',
}: UpgradeButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { track } = useAnalytics();

  const handleUpgrade = async () => {
    setIsLoading(true);
    track('upgrade_started', { billingPeriod });

    try {
      const result = await createProCheckout(billingPeriod);
      if ('error' in result) {
        throw new Error(result.error);
      }
      window.location.href = result.url;
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : 'Could not start checkout. Please try again.',
      );
      setIsLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleUpgrade}
      disabled={isLoading}
      className={`flex w-full items-center justify-center gap-2 rounded-xl bg-black px-6 py-3.5 font-semibold text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    >
      {isLoading && (
        <FontAwesomeIcon icon={faSpinner} className="h-4 w-4 animate-spin" />
      )}
      {isLoading ? 'Starting…' : label}
    </button>
  );
}
