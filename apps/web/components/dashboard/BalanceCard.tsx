interface BalanceCardProps {
  title: string;
  amount: number;
  currency?: string;
  variant?: "primary" | "default";
  isCount?: boolean;
  label?: string;
}

export default function BalanceCard({
  title,
  amount,
  currency = "GBP",
  variant = "default",
  isCount = false,
  label,
}: BalanceCardProps) {
  const formattedAmount = isCount
    ? amount.toString()
    : new Intl.NumberFormat("en-GB", {
        style: "currency",
        currency,
      }).format(Math.abs(amount));

  const isNegative = amount < 0;

  return (
    <div
      className={`rounded-xl p-6 ${
        variant === "primary"
          ? "bg-black text-white"
          : "bg-white border border-gray-100 shadow-sm"
      }`}
    >
      <p
        className={`text-sm font-medium ${
          variant === "primary" ? "text-gray-300" : "text-gray-500"
        }`}
      >
        {title}
      </p>
      <div className="mt-2 flex items-baseline gap-2">
        <span
          className={`text-3xl font-bold ${
            variant === "primary"
              ? "text-white"
              : isNegative
                ? "text-red-600"
                : "text-gray-900"
          }`}
        >
          {isNegative && !isCount && "-"}
          {formattedAmount}
        </span>
        {label && (
          <span
            className={`text-sm ${
              variant === "primary" ? "text-gray-400" : "text-gray-500"
            }`}
          >
            {label}
          </span>
        )}
      </div>
    </div>
  );
}
