import type { BudgetProgressItem } from '@/actions/budgets';
import BudgetProgressCard from './BudgetProgressCard';

interface BudgetProgressListProps {
  items: BudgetProgressItem[];
}

export default function BudgetProgressList({ items }: BudgetProgressListProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {items.map((item) => (
        <BudgetProgressCard key={item.category} {...item} />
      ))}
    </div>
  );
}
