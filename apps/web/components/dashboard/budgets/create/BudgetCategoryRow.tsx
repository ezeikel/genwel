'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { SpendingCategory } from '@genwel/db';
import { Input } from '@/components/ui/input';
import {
  formatCategoryName,
  getCategoryColor,
  getCategoryIcon,
} from '@/lib/budget-utils';
import AiSuggestionBadge from './AiSuggestionBadge';

interface BudgetCategoryRowProps {
  category: SpendingCategory;
  amount: string;
  aiSuggestion?: number | null;
  onChange: (value: string) => void;
  onApplySuggestion?: () => void;
}

export default function BudgetCategoryRow({
  category,
  amount,
  aiSuggestion,
  onChange,
  onApplySuggestion,
}: BudgetCategoryRowProps) {
  const icon = getCategoryIcon(category);
  const colorClass = getCategoryColor(category);

  return (
    <div className="flex items-center gap-3 py-3">
      <div
        className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${colorClass}`}
      >
        <FontAwesomeIcon icon={icon} className="w-4 h-4" />
      </div>
      <span className="text-sm font-medium text-gray-900 w-32 flex-shrink-0">
        {formatCategoryName(category)}
      </span>
      <div className="flex items-center gap-2 flex-1">
        <div className="relative w-32">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
            £
          </span>
          <Input
            type="number"
            min={0}
            step={5}
            value={amount}
            onChange={(e) => onChange(e.target.value)}
            className="pl-7"
            placeholder="0"
          />
        </div>
        {aiSuggestion != null && aiSuggestion > 0 && onApplySuggestion && (
          <AiSuggestionBadge
            amount={aiSuggestion}
            onApply={onApplySuggestion}
          />
        )}
      </div>
    </div>
  );
}
