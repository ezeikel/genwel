'use client';

interface AiSuggestionBadgeProps {
  amount: number;
  onApply: () => void;
}

export default function AiSuggestionBadge({
  amount,
  onApply,
}: AiSuggestionBadgeProps) {
  return (
    <button
      type="button"
      onClick={onApply}
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-violet-100 text-violet-700 hover:bg-violet-200 transition-colors"
      title="Click to apply AI suggestion"
    >
      AI: £{amount.toFixed(0)}
    </button>
  );
}
