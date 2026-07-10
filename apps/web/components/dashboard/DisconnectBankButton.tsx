'use client';

import { faSpinner, faTrash } from '@fortawesome/pro-light-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { disconnectBank } from '@/actions/banking';

interface DisconnectBankButtonProps {
  connectionId: string;
  providerName: string;
}

/**
 * Connection-level disconnect. Removes the whole bank connection and all its
 * accounts + transactions (the server action cascades). Lives on the connection
 * header, not per-account, since that's what it actually removes.
 */
export default function DisconnectBankButton({
  connectionId,
  providerName,
}: DisconnectBankButtonProps) {
  const router = useRouter();
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const handleDisconnect = async () => {
    if (
      !confirm(
        `Disconnect ${providerName}? All accounts and transactions from this bank will be removed. You can reconnect at any time.`,
      )
    ) {
      return;
    }

    setIsDisconnecting(true);

    try {
      const result = await disconnectBank(connectionId);

      if (result.error) {
        throw new Error(result.error);
      }

      router.refresh();
    } catch {
      alert('Failed to disconnect bank. Please try again.');
      setIsDisconnecting(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleDisconnect}
      disabled={isDisconnecting}
      className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-600 border border-gray-200 hover:border-red-200 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <FontAwesomeIcon
        icon={isDisconnecting ? faSpinner : faTrash}
        className={`w-3.5 h-3.5 ${isDisconnecting ? 'animate-spin' : ''}`}
      />
      {isDisconnecting ? 'Disconnecting…' : 'Disconnect'}
    </button>
  );
}
