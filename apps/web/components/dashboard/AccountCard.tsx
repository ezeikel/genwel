"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/pro-light-svg-icons";
import { disconnectBank } from "@/actions/banking";

interface AccountCardProps {
  account: {
    id: string;
    displayName: string;
    accountType: string;
    balance: number;
    currency: string;
    balanceUpdatedAt: Date | null;
  };
  connectionId: string;
}

export default function AccountCard({
  account,
  connectionId,
}: AccountCardProps) {
  const router = useRouter();
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const handleDisconnect = async () => {
    if (
      !confirm(
        "Are you sure you want to disconnect this bank? All account data will be removed."
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
      alert("Failed to disconnect bank. Please try again.");
    } finally {
      setIsDisconnecting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs bg-gray-100 px-2 py-1 rounded-full capitalize text-gray-600">
          {account.accountType.replace("_", " ")}
        </span>
        <button
          onClick={handleDisconnect}
          disabled={isDisconnecting}
          className="text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
          title="Disconnect bank"
        >
          <FontAwesomeIcon icon={faTrash} className="w-4 h-4" />
        </button>
      </div>

      <p className="font-medium text-gray-900 mb-1">{account.displayName}</p>

      <p className="text-2xl font-bold text-gray-900 mb-2">
        {new Intl.NumberFormat("en-GB", {
          style: "currency",
          currency: account.currency,
        }).format(account.balance)}
      </p>

      {account.balanceUpdatedAt && (
        <p className="text-xs text-gray-400">
          Updated{" "}
          {new Intl.DateTimeFormat("en-GB", {
            dateStyle: "short",
            timeStyle: "short",
          }).format(account.balanceUpdatedAt)}
        </p>
      )}
    </div>
  );
}
