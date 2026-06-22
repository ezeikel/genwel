'use client';

import {
  faSpinner,
  faWandMagicSparkles,
} from '@fortawesome/pro-light-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { generateInsights } from '@/actions/ai-budgets';
import { Button } from '@/components/ui/button';

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
        className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
      />
      {loading ? 'Generating...' : 'Refresh Insights'}
    </Button>
  );
}
