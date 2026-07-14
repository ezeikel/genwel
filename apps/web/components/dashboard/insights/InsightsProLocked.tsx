import { faLightbulb, faLock } from '@fortawesome/pro-duotone-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Link from 'next/link';

/**
 * Free-tier locked state for the Insights page. AI insights are a Pro feature
 * (PLAN_FEATURES.aiInsights), so instead of a broken empty page, free users see
 * a clear teaser + upgrade CTA.
 */

const TEASERS = [
  'You spent 22% more on eating out than last month.',
  'Your subscriptions total £142/mo — two overlap.',
  'Groceries are trending down — nice work.',
];

export default function InsightsProLocked() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      {/* blurred teaser insights behind the lock */}
      <div className="relative">
        <div
          className="space-y-3 p-6 blur-[3px] select-none"
          aria-hidden="true"
        >
          {TEASERS.map((t) => (
            <div
              key={t}
              className="flex items-start gap-3 rounded-xl border border-border p-4"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <FontAwesomeIcon icon={faLightbulb} className="h-4 w-4" />
              </span>
              <p className="text-sm text-foreground">{t}</p>
            </div>
          ))}
        </div>

        {/* lock overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-card/40 px-6 text-center backdrop-blur-[1px]">
          <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <FontAwesomeIcon icon={faLock} className="h-5 w-5" />
          </span>
          <h3 className="text-lg font-semibold text-foreground">
            Personalised insights are a Pro feature
          </h3>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            Genwel spots what changed in your spending, what to cut, and where
            you’re drifting — in plain English, every month.
          </p>
          <Link
            href="/pricing"
            className="mt-5 inline-flex items-center rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Upgrade to Pro — 7 days free
          </Link>
        </div>
      </div>
    </div>
  );
}
