import type { SpendingCategory } from "@genwel/db";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faShoppingBag,
  faCartShopping,
  faUtensils,
  faReceipt,
  faBus,
  faFilm,
  faHeartPulse,
  faSparkles,
  faGraduationCap,
  faArrowRightArrowLeft,
  faMoneyBill,
  faPiggyBank,
  faCircleDollar,
  faVault,
  faPaperPlane,
  faRepeat,
  faEllipsis,
} from "@fortawesome/pro-light-svg-icons";

/**
 * Calculate the current budget period based on period type and optional payday date.
 *
 * CALENDAR_MONTH: 1st to last day of current month.
 * PAYDAY: paydayDate of current month to (paydayDate - 1) of next month.
 *   If today is before this month's payday, the period started last month.
 */
export function getCurrentPeriod(
  periodType: "CALENDAR_MONTH" | "PAYDAY",
  paydayDate?: number | null,
): { start: Date; end: Date } {
  const now = new Date();

  if (periodType === "CALENDAR_MONTH") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    return { start, end };
  }

  // PAYDAY period
  const day = paydayDate ?? 25;
  const today = now.getDate();

  let start: Date;
  let end: Date;

  if (today >= day) {
    // Current period started this month
    start = clampDayToMonth(now.getFullYear(), now.getMonth(), day);
    const nextMonth = now.getMonth() + 1;
    const nextYear = nextMonth > 11 ? now.getFullYear() + 1 : now.getFullYear();
    const normMonth = nextMonth > 11 ? 0 : nextMonth;
    end = new Date(
      clampDayToMonth(nextYear, normMonth, day).getTime() - 1,
    );
  } else {
    // Current period started last month
    const prevMonth = now.getMonth() - 1;
    const prevYear = prevMonth < 0 ? now.getFullYear() - 1 : now.getFullYear();
    const normMonth = prevMonth < 0 ? 11 : prevMonth;
    start = clampDayToMonth(prevYear, normMonth, day);
    end = new Date(
      clampDayToMonth(now.getFullYear(), now.getMonth(), day).getTime() - 1,
    );
  }

  return { start, end };
}

/** Clamp a day to the max days in a given month (e.g. 31 in Feb → 28/29). */
function clampDayToMonth(year: number, month: number, day: number): Date {
  const maxDays = new Date(year, month + 1, 0).getDate();
  return new Date(year, month, Math.min(day, maxDays));
}

/** Convert SpendingCategory enum to display name. */
export function formatCategoryName(category: SpendingCategory): string {
  const names: Record<SpendingCategory, string> = {
    SHOPPING: "Shopping",
    GROCERIES: "Groceries",
    EATING_OUT: "Eating Out",
    BILLS: "Bills",
    TRANSPORT: "Transport",
    ENTERTAINMENT: "Entertainment",
    HEALTH: "Health",
    PERSONAL_CARE: "Personal Care",
    EDUCATION: "Education",
    TRANSFER: "Transfer",
    CASH: "Cash",
    INCOME: "Income",
    FEES: "Fees",
    SAVINGS: "Savings",
    REMITTANCES: "Remittances",
    SUBSCRIPTIONS: "Subscriptions",
    OTHER: "Other",
  };
  return names[category] ?? category;
}

/** FontAwesome icon for each spending category. */
export function getCategoryIcon(category: SpendingCategory): IconDefinition {
  const icons: Record<SpendingCategory, IconDefinition> = {
    SHOPPING: faShoppingBag,
    GROCERIES: faCartShopping,
    EATING_OUT: faUtensils,
    BILLS: faReceipt,
    TRANSPORT: faBus,
    ENTERTAINMENT: faFilm,
    HEALTH: faHeartPulse,
    PERSONAL_CARE: faSparkles,
    EDUCATION: faGraduationCap,
    TRANSFER: faArrowRightArrowLeft,
    CASH: faMoneyBill,
    INCOME: faPiggyBank,
    FEES: faCircleDollar,
    SAVINGS: faVault,
    REMITTANCES: faPaperPlane,
    SUBSCRIPTIONS: faRepeat,
    OTHER: faEllipsis,
  };
  return icons[category] ?? faEllipsis;
}

/** Tailwind color classes for each spending category. */
export function getCategoryColor(category: SpendingCategory): string {
  const colors: Record<SpendingCategory, string> = {
    SHOPPING: "bg-purple-100 text-purple-600",
    GROCERIES: "bg-lime-100 text-lime-700",
    EATING_OUT: "bg-orange-100 text-orange-600",
    BILLS: "bg-blue-100 text-blue-600",
    TRANSPORT: "bg-sky-100 text-sky-600",
    ENTERTAINMENT: "bg-pink-100 text-pink-600",
    HEALTH: "bg-red-100 text-red-600",
    PERSONAL_CARE: "bg-fuchsia-100 text-fuchsia-600",
    EDUCATION: "bg-indigo-100 text-indigo-600",
    TRANSFER: "bg-gray-100 text-gray-600",
    CASH: "bg-green-100 text-green-600",
    INCOME: "bg-emerald-100 text-emerald-600",
    FEES: "bg-rose-100 text-rose-600",
    SAVINGS: "bg-teal-100 text-teal-600",
    REMITTANCES: "bg-cyan-100 text-cyan-600",
    SUBSCRIPTIONS: "bg-violet-100 text-violet-600",
    OTHER: "bg-gray-100 text-gray-500",
  };
  return colors[category] ?? "bg-gray-100 text-gray-500";
}

/** Hex color for charts. */
export function getCategoryChartColor(category: SpendingCategory): string {
  const colors: Record<SpendingCategory, string> = {
    SHOPPING: "#9333ea",
    GROCERIES: "#65a30d",
    EATING_OUT: "#ea580c",
    BILLS: "#2563eb",
    TRANSPORT: "#0284c7",
    ENTERTAINMENT: "#db2777",
    HEALTH: "#dc2626",
    PERSONAL_CARE: "#c026d3",
    EDUCATION: "#4f46e5",
    TRANSFER: "#6b7280",
    CASH: "#16a34a",
    INCOME: "#059669",
    FEES: "#e11d48",
    SAVINGS: "#0d9488",
    REMITTANCES: "#0891b2",
    SUBSCRIPTIONS: "#7c3aed",
    OTHER: "#9ca3af",
  };
  return colors[category] ?? "#9ca3af";
}

/** Budget status based on percentage used. */
export function getBudgetStatus(
  percentUsed: number,
): "on_track" | "warning" | "over_budget" {
  if (percentUsed > 100) return "over_budget";
  if (percentUsed >= 75) return "warning";
  return "on_track";
}

/** Format a number as GBP (or other currency). */
export function formatCurrency(amount: number, currency = "GBP"): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
  }).format(amount);
}
