import BalanceCard from "@/components/dashboard/BalanceCard";

interface BudgetSummaryCardsProps {
  totalBudgeted: number;
  totalSpent: number;
}

export default function BudgetSummaryCards({
  totalBudgeted,
  totalSpent,
}: BudgetSummaryCardsProps) {
  const remaining = totalBudgeted - totalSpent;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <BalanceCard
        title="Total Budgeted"
        amount={totalBudgeted}
        currency="GBP"
        variant="primary"
      />
      <BalanceCard
        title="Total Spent"
        amount={-totalSpent}
        currency="GBP"
        label="Spent"
      />
      <BalanceCard
        title="Remaining"
        amount={remaining}
        currency="GBP"
      />
    </div>
  );
}
