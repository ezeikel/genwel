import {
  faLightbulb,
  faTriangleExclamation,
} from '@fortawesome/pro-light-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Link from 'next/link';
import type { InsightsEmptyReason } from '@/actions/ai-budgets';

/**
 * Context-aware empty state. The old copy always said "connect a bank account",
 * which was wrong for users who already had accounts. Now the message matches
 * why there are no insights.
 */

const CONTENT: Record<
  NonNullable<InsightsEmptyReason>,
  { icon: typeof faLightbulb; title: string; body: string; cta?: boolean }
> = {
  no_accounts: {
    icon: faLightbulb,
    title: 'Connect a bank to get started',
    body: 'Once you connect an account, Genwel builds personalised insights from your spending.',
    cta: true,
  },
  no_recent_activity: {
    icon: faLightbulb,
    title: 'Not enough recent activity yet',
    body: 'Insights compare this month with last. Once there’s some spending this month, they’ll appear here automatically.',
  },
  generation_failed: {
    icon: faTriangleExclamation,
    title: 'Couldn’t generate insights right now',
    body: 'Something went wrong while analysing your spending. Hit Refresh Insights to try again.',
  },
};

export default function InsightsEmptyState({
  reason = 'no_recent_activity',
}: {
  reason?: InsightsEmptyReason;
}) {
  const content = CONTENT[reason ?? 'no_recent_activity'];

  return (
    <div className="rounded-2xl border border-border bg-card p-12 text-center shadow-sm">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <FontAwesomeIcon
          icon={content.icon}
          className="h-8 w-8 text-muted-foreground"
        />
      </div>
      <h3 className="mb-2 text-lg font-semibold text-foreground">
        {content.title}
      </h3>
      <p className="mx-auto max-w-md text-muted-foreground">{content.body}</p>
      {content.cta && (
        <Link
          href="/dashboard/accounts"
          className="mt-5 inline-flex items-center rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Connect a bank
        </Link>
      )}
    </div>
  );
}
