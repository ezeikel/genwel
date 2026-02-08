import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { SpendingCategory } from "@genwel/db";
import { Badge } from "@/components/ui/badge";
import {
  formatCategoryName,
  getCategoryIcon,
  getCategoryColor,
  formatCurrency,
} from "@/lib/budget-utils";

interface BudgetProgressCardProps {
  category: SpendingCategory;
  budgetAmount: number;
  spent: number;
  remaining: number;
  percentUsed: number;
  status: "on_track" | "warning" | "over_budget";
}

const statusConfig = {
  on_track: { label: "On Track", variant: "secondary" as const, progressColor: "bg-green-500" },
  warning: { label: "Warning", variant: "outline" as const, progressColor: "bg-amber-500" },
  over_budget: { label: "Over Budget", variant: "destructive" as const, progressColor: "bg-red-500" },
};

export default function BudgetProgressCard({
  category,
  budgetAmount,
  spent,
  remaining,
  percentUsed,
  status,
}: BudgetProgressCardProps) {
  const { label, variant, progressColor } = statusConfig[status];
  const icon = getCategoryIcon(category);
  const colorClass = getCategoryColor(category);

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center ${colorClass}`}
          >
            <FontAwesomeIcon icon={icon} className="w-4 h-4" />
          </div>
          <div>
            <p className="font-medium text-gray-900">
              {formatCategoryName(category)}
            </p>
            <p className="text-sm text-gray-500">
              {formatCurrency(spent)} of {formatCurrency(budgetAmount)}
            </p>
          </div>
        </div>
        <Badge variant={variant}>{label}</Badge>
      </div>

      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${progressColor} transition-all`}
          style={{ width: `${Math.min(percentUsed, 100)}%` }}
        />
      </div>

      <div className="flex justify-between mt-2 text-xs text-gray-500">
        <span>{Math.round(percentUsed)}% used</span>
        <span>{formatCurrency(remaining)} left</span>
      </div>
    </div>
  );
}
