import { faArrowUp, faCalendar } from '@fortawesome/pro-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import MerchantIcon from '@/components/dashboard/MerchantIcon';
import { formatMoney } from '@/lib/accounts';
import type { Subscription } from '@/lib/subscriptions';

const CADENCE_LABEL: Record<Subscription['cadence'], string> = {
  weekly: 'Weekly',
  monthly: 'Monthly',
  yearly: 'Yearly',
  irregular: 'Recurring',
};

function renewalLabel(next: Date | null): string | null {
  if (!next) return null;
  const days = Math.round(
    (next.getTime() - Date.now()) / (24 * 60 * 60 * 1000),
  );
  if (days < 0) return 'due now';
  if (days === 0) return 'renews today';
  if (days === 1) return 'renews tomorrow';
  if (days <= 14) return `renews in ${days} days`;
  return `renews ${next.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`;
}

export default function SubscriptionRow({ sub }: { sub: Subscription }) {
  const renewal = renewalLabel(sub.nextRenewal);
  const soon =
    sub.nextRenewal &&
    sub.nextRenewal.getTime() - Date.now() <= 3 * 24 * 60 * 60 * 1000;

  return (
    <div className="flex items-center gap-4 px-5 py-3.5">
      <MerchantIcon
        merchant={sub.name}
        category={sub.category ?? 'SUBSCRIPTIONS'}
      />

      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-foreground">{sub.name}</p>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
          <span>{CADENCE_LABEL[sub.cadence]}</span>
          {renewal && (
            <span
              className={`inline-flex items-center gap-1 ${soon ? 'text-amber-600' : ''}`}
            >
              <FontAwesomeIcon icon={faCalendar} className="h-3 w-3" />
              {renewal}
            </span>
          )}
          {sub.priceRise && (
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-1.5 py-0.5 font-medium text-rose-600">
              <FontAwesomeIcon icon={faArrowUp} className="h-2.5 w-2.5" />
              up {formatMoney(sub.priceRise.delta, 'GBP', { decimals: true })}
            </span>
          )}
        </div>
      </div>

      <div className="text-right">
        <p className="font-semibold tabular-nums text-foreground">
          {formatMoney(sub.amount, 'GBP', { decimals: true })}
        </p>
        {sub.cadence !== 'monthly' && (
          <p className="text-xs text-muted-foreground">
            {formatMoney(sub.monthlyAmount, 'GBP', { decimals: true })}/mo
          </p>
        )}
      </div>
    </div>
  );
}
