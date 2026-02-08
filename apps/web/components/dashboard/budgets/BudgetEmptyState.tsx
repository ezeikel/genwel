"use client";

import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChartPie } from "@fortawesome/pro-light-svg-icons";
import { Button } from "@/components/ui/button";

export default function BudgetEmptyState() {
  return (
    <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-100 text-center">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <FontAwesomeIcon icon={faChartPie} className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        No budget set up yet
      </h3>
      <p className="text-gray-500 mb-6 max-w-md mx-auto">
        Create a budget to track your spending by category. Choose between
        calendar month or payday-to-payday periods.
      </p>
      <Button asChild>
        <Link href="/dashboard/budgets/create">Create Your Budget</Link>
      </Button>
    </div>
  );
}
