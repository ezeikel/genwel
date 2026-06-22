'use client';

import { faLightbulb } from '@fortawesome/pro-light-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export default function InsightsEmptyState() {
  return (
    <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-100 text-center">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <FontAwesomeIcon icon={faLightbulb} className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        No insights yet
      </h3>
      <p className="text-gray-500 max-w-md mx-auto">
        Connect a bank account and let your transactions build up. Genwel will
        generate personalised spending insights based on your spending patterns.
      </p>
    </div>
  );
}
