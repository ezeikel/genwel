"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faWandMagicSparkles, faSpinner } from "@fortawesome/pro-light-svg-icons";
import { Button } from "@/components/ui/button";
import { generateInsights } from "@/actions/ai-budgets";

export default function GenerateInsightsButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      await generateInsights();
      router.refresh();
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="outline"
      onClick={handleClick}
      disabled={loading}
      className="gap-2"
    >
      <FontAwesomeIcon
        icon={loading ? faSpinner : faWandMagicSparkles}
        className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
      />
      {loading ? "Generating..." : "Refresh Insights"}
    </Button>
  );
}
