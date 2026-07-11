'use client';

import { faPlus, faSpinner } from '@fortawesome/pro-light-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useState } from 'react';
import { connectBank } from '@/actions/banking';
import { useAnalytics } from '@/utils/analytics-client';

export default function ConnectBankButton() {
  const [isLoading, setIsLoading] = useState(false);
  const { track } = useAnalytics();

  const handleConnect = async () => {
    setIsLoading(true);
    track('bank_connect_started');

    try {
      const result = await connectBank();

      if (result.error) {
        throw new Error(result.error);
      }

      if (result.url) {
        window.location.href = result.url;
      }
    } catch {
      alert('Failed to connect bank. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleConnect}
      disabled={isLoading}
      className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <FontAwesomeIcon
        icon={isLoading ? faSpinner : faPlus}
        className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`}
      />
      {isLoading ? 'Connecting...' : 'Connect Bank'}
    </button>
  );
}
