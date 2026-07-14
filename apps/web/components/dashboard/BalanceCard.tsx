interface BalanceCardProps {
  title: string;
  amount: number;
  currency?: string;
  variant?: 'primary' | 'default';
  isCount?: boolean;
  label?: string;
}

export default function BalanceCard({
  title,
  amount,
  currency = 'GBP',
  variant = 'default',
  isCount = false,
  label,
}: BalanceCardProps) {
  const formattedAmount = isCount
    ? amount.toString()
    : new Intl.NumberFormat('en-GB', {
        style: 'currency',
        currency,
      }).format(Math.abs(amount));

  const isNegative = amount < 0;

  return (
    <div
      className={`rounded-2xl p-6 ${
        variant === 'primary'
          ? 'bg-primary text-primary-foreground'
          : 'bg-card border border-border shadow-sm'
      }`}
    >
      <p
        className={`text-sm font-medium ${
          variant === 'primary'
            ? 'text-primary-foreground/80'
            : 'text-muted-foreground'
        }`}
      >
        {title}
      </p>
      <div className="mt-2 flex items-baseline gap-2">
        <span
          className={`text-3xl font-bold ${
            variant === 'primary'
              ? 'text-primary-foreground'
              : isNegative
                ? 'text-red-600'
                : 'text-foreground'
          }`}
        >
          {isNegative && !isCount && '-'}
          {formattedAmount}
        </span>
        {label && (
          <span
            className={`text-sm ${
              variant === 'primary'
                ? 'text-primary-foreground/70'
                : 'text-muted-foreground'
            }`}
          >
            {label}
          </span>
        )}
      </div>
    </div>
  );
}
