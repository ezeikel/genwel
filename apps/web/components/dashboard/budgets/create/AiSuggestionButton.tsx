"use client";

import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faWandMagicSparkles, faSpinner } from "@fortawesome/pro-light-svg-icons";
import { Button } from "@/components/ui/button";
import { getAiBudgetSuggestions } from "@/actions/ai-budgets";
import type { SpendingCategory } from "@genwel/db";

interface AiSuggestionButtonProps {
  onSuggestionsReceived: (
    suggestions: { category: SpendingCategory; amount: number; reasoning: string }[],
  ) => void;
}

export default function AiSuggestionButton({
  onSuggestionsReceived,
}: AiSuggestionButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      const result = await getAiBudgetSuggestions();
      if ("error" in result && result.error) {
        setError(result.error);
      } else if ("suggestions" in result && result.suggestions) {
        onSuggestionsReceived(result.suggestions);
      }
    } catch {
      setError("Failed to get AI suggestions");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Button
        type="button"
        variant="outline"
        onClick={handleClick}
        disabled={loading}
        className="gap-2"
      >
        <FontAwesomeIcon
          icon={loading ? faSpinner : faWandMagicSparkles}
          className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
        />
        {loading ? "Analysing spending..." : "Get AI Suggestions"}
      </Button>
      {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
    </div>
  );
}
