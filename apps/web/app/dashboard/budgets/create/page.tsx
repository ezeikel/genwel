import { getBudgetConfig } from '@/actions/budgets';
import { auth } from '@/auth';
import BudgetCreateForm from '@/components/dashboard/budgets/create/BudgetCreateForm';

export default async function BudgetCreatePage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const result = await getBudgetConfig();
  const initialConfig =
    result && 'config' in result && result.config
      ? {
          periodType: result.config.periodType as 'CALENDAR_MONTH' | 'PAYDAY',
          paydayDate: result.config.paydayDate,
          budgets: result.config.budgets.map((b) => ({
            category: b.category,
            amount: b.amount,
          })),
        }
      : null;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">
        {initialConfig ? 'Edit Your Budget' : 'Create Your Budget'}
      </h1>
      <BudgetCreateForm initialConfig={initialConfig} />
    </div>
  );
}
