import Link from "next/link";
import { auth } from "@/auth";
import { getBudgetProgress } from "@/actions/budgets";
import { syncUserTransactions } from "@/lib/banking/sync";
import { categorizeUserTransactions } from "@/lib/banking/categorize";
import { Button } from "@/components/ui/button";
import BudgetSummaryCards from "@/components/dashboard/budgets/BudgetSummaryCards";
import BudgetProgressList from "@/components/dashboard/budgets/BudgetProgressList";
import SpendingDonutChart from "@/components/dashboard/budgets/SpendingDonutChart";
import BudgetEmptyState from "@/components/dashboard/budgets/BudgetEmptyState";

export default async function BudgetsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  // Sync transactions from TrueLayer, then AI-categorize for budget tracking
  await syncUserTransactions(session.user.id);
  await categorizeUserTransactions(session.user.id);

  const result = await getBudgetProgress();

  if ("error" in result) return null;

  const { progress, totalBudgeted, totalSpent } = result;

  if (!progress || progress.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Budgets</h1>
        <BudgetEmptyState />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Budgets</h1>
        <Button asChild variant="outline">
          <Link href="/dashboard/budgets/create">Edit Budget</Link>
        </Button>
      </div>

      <div className="space-y-8">
        <BudgetSummaryCards
          totalBudgeted={totalBudgeted}
          totalSpent={totalSpent}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Category Progress
            </h2>
            <BudgetProgressList items={progress} />
          </div>
          <div>
            <SpendingDonutChart items={progress} />
          </div>
        </div>
      </div>
    </div>
  );
}
