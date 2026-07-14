'use client';

import { faChartPie } from '@fortawesome/pro-light-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function BudgetEmptyState() {
  return (
    <div className="bg-card rounded-2xl p-12 shadow-sm border border-border text-center">
      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
        <FontAwesomeIcon
          icon={faChartPie}
          className="w-8 h-8 text-muted-foreground/70"
        />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">
        No budget set up yet
      </h3>
      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
        Create a budget to track your spending by category. Choose between
        calendar month or payday-to-payday periods.
      </p>
      <Button asChild>
        <Link href="/dashboard/budgets/create">Create Your Budget</Link>
      </Button>
    </div>
  );
}
