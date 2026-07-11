'use client';

import { SpendingCategory } from '@genwel/db';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { createOrUpdateBudgetConfig, setBudgets } from '@/actions/budgets';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useAnalytics } from '@/utils/analytics-client';
import AiSuggestionButton from './AiSuggestionButton';
import BudgetCategoryRow from './BudgetCategoryRow';
import BudgetPeriodSelector from './BudgetPeriodSelector';

// Categories that make sense as budget targets (exclude income/transfer/fees)
const BUDGETABLE_CATEGORIES: SpendingCategory[] = [
  'GROCERIES',
  'EATING_OUT',
  'SHOPPING',
  'BILLS',
  'TRANSPORT',
  'ENTERTAINMENT',
  'HEALTH',
  'PERSONAL_CARE',
  'EDUCATION',
  'SUBSCRIPTIONS',
  'SAVINGS',
  'CASH',
  'REMITTANCES',
  'OTHER',
];

interface BudgetCreateFormProps {
  initialConfig?: {
    periodType: 'CALENDAR_MONTH' | 'PAYDAY';
    paydayDate: number | null;
    budgets: { category: SpendingCategory; amount: string }[];
  } | null;
}

export default function BudgetCreateForm({
  initialConfig,
}: BudgetCreateFormProps) {
  const router = useRouter();
  const { track } = useAnalytics();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [periodType, setPeriodType] = useState<'CALENDAR_MONTH' | 'PAYDAY'>(
    initialConfig?.periodType ?? 'CALENDAR_MONTH',
  );
  const [paydayDate, setPaydayDate] = useState(initialConfig?.paydayDate ?? 25);

  // Build initial amounts map from existing budgets
  const initialAmounts: Record<string, string> = {};
  for (const b of initialConfig?.budgets ?? []) {
    initialAmounts[b.category] = b.amount;
  }
  const [amounts, setAmounts] =
    useState<Record<string, string>>(initialAmounts);

  const [aiSuggestions, setAiSuggestions] = useState<
    Record<string, { amount: number; reasoning: string }>
  >({});

  function handleAmountChange(category: SpendingCategory, value: string) {
    setAmounts((prev) => ({ ...prev, [category]: value }));
  }

  function handleSuggestionsReceived(
    suggestions: {
      category: SpendingCategory;
      amount: number;
      reasoning: string;
    }[],
  ) {
    const map: Record<string, { amount: number; reasoning: string }> = {};
    for (const s of suggestions) {
      map[s.category] = { amount: s.amount, reasoning: s.reasoning };
    }
    setAiSuggestions(map);
  }

  function applySuggestion(category: SpendingCategory) {
    const s = aiSuggestions[category];
    if (s) {
      setAmounts((prev) => ({ ...prev, [category]: s.amount.toString() }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      // 1. Save config
      const configResult = await createOrUpdateBudgetConfig({
        periodType,
        paydayDate: periodType === 'PAYDAY' ? paydayDate : null,
      });

      if ('error' in configResult && configResult.error) {
        setError(configResult.error);
        return;
      }

      // 2. Save budget lines
      const budgetLines = BUDGETABLE_CATEGORIES.filter(
        (cat) => amounts[cat] && Number(amounts[cat]) > 0,
      ).map((cat) => ({
        category: cat,
        amount: Number(amounts[cat]),
      }));

      if (budgetLines.length === 0) {
        setError('Set at least one category budget');
        return;
      }

      const budgetResult = await setBudgets({ budgets: budgetLines });

      if ('error' in budgetResult && budgetResult.error) {
        setError(budgetResult.error);
        return;
      }

      track('budget_created', {
        periodType,
        categoryCount: budgetLines.length,
        totalBudget: budgetLines.reduce((sum, b) => sum + b.amount, 0),
        usedAiSuggestions: Object.keys(aiSuggestions).length > 0,
        isUpdate: Boolean(initialConfig),
      });

      router.push('/dashboard/budgets');
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <BudgetPeriodSelector
          periodType={periodType}
          paydayDate={paydayDate}
          onPeriodTypeChange={setPeriodType}
          onPaydayDateChange={setPaydayDate}
        />
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-900">
            Category Budgets
          </h3>
          <AiSuggestionButton
            onSuggestionsReceived={handleSuggestionsReceived}
          />
        </div>

        <Separator className="mb-2" />

        <div className="divide-y divide-gray-50">
          {BUDGETABLE_CATEGORIES.map((category) => (
            <BudgetCategoryRow
              key={category}
              category={category}
              amount={amounts[category] ?? ''}
              aiSuggestion={aiSuggestions[category]?.amount}
              onChange={(v) => handleAmountChange(category, v)}
              onApplySuggestion={() => applySuggestion(category)}
            />
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending
            ? 'Saving...'
            : initialConfig
              ? 'Update Budget'
              : 'Create Budget'}
        </Button>
      </div>
    </form>
  );
}
