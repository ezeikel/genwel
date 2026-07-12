'use client';

import {
  faBoltLightning,
  faCheck,
  faWallet,
} from '@fortawesome/pro-light-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useState } from 'react';
import UpgradeButton from '@/components/billing/UpgradeButton';

const PRO_FEATURES = [
  'Unlimited bank & card connections',
  'Full Fixable Problems — every duplicate sub, price rise & overspend',
  'Ask Genwel — your AI money assistant',
  'Personalised AI insights',
  'Budgets with AI-suggested limits',
  'Custom categories, full history & data export',
];

const FREE_FEATURES = [
  'Connect up to 2 banks',
  'Automatic AI categorization',
  'Net worth across your accounts',
  'This month’s spending by category',
  '1 Fixable Problem revealed each month',
];

export default function PricingCards() {
  const [annual, setAnnual] = useState(true);

  const price = annual ? '£54.99' : '£6.99';
  const per = annual ? '/year' : '/month';
  const effective = annual ? '£4.58/mo billed yearly' : 'billed monthly';

  return (
    <div className="mx-auto w-full max-w-4xl">
      {/* Billing toggle — segmented control */}
      <div className="mb-10 flex justify-center">
        <div className="inline-flex items-center gap-1 rounded-full border border-border bg-card p-1">
          <button
            type="button"
            onClick={() => setAnnual(false)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              !annual
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setAnnual(true)}
            className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              annual
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Annual
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                annual
                  ? 'bg-accent text-accent-foreground'
                  : 'bg-accent/20 text-accent-foreground'
              }`}
            >
              Save 34%
            </span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-2">
        {/* Free */}
        <div className="flex flex-col rounded-3xl border border-border bg-card p-8">
          <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-muted">
            <FontAwesomeIcon
              icon={faWallet}
              className="h-5 w-5 text-muted-foreground"
            />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Free</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            See your money clearly.
          </p>
          <div className="mt-6 flex items-baseline gap-1">
            <span className="text-4xl font-bold tracking-tight text-foreground">
              £0
            </span>
            <span className="text-muted-foreground">forever</span>
          </div>
          <ul className="mt-8 flex flex-col gap-3.5">
            {FREE_FEATURES.map((f) => (
              <li
                key={f}
                className="flex items-start gap-3 text-sm text-foreground/80"
              >
                <FontAwesomeIcon
                  icon={faCheck}
                  className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
                />
                {f}
              </li>
            ))}
          </ul>
          <a
            href="/dashboard"
            className="mt-8 flex w-full items-center justify-center rounded-xl border border-border px-6 py-3.5 font-semibold text-foreground transition-colors hover:bg-muted"
          >
            Get started free
          </a>
        </div>

        {/* Pro — primary-ringed, accent badge */}
        <div className="relative flex flex-col rounded-3xl border-2 border-primary bg-card p-8 shadow-xl shadow-primary/5">
          <span className="absolute -top-3 left-8 flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
            <FontAwesomeIcon icon={faBoltLightning} className="h-3 w-3" />
            Most popular
          </span>
          <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10">
            <FontAwesomeIcon
              icon={faBoltLightning}
              className="h-5 w-5 text-primary"
            />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Pro</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            The full picture, plus AI that does the work.
          </p>
          <div className="mt-6 flex items-baseline gap-1">
            <span className="text-4xl font-bold tracking-tight text-foreground">
              {price}
            </span>
            <span className="text-muted-foreground">{per}</span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{effective}</p>
          <ul className="mt-8 flex flex-col gap-3.5">
            {PRO_FEATURES.map((f) => (
              <li
                key={f}
                className="flex items-start gap-3 text-sm text-foreground/90"
              >
                <FontAwesomeIcon
                  icon={faCheck}
                  className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                />
                {f}
              </li>
            ))}
          </ul>
          <div className="mt-8">
            <UpgradeButton billingPeriod={annual ? 'annual' : 'monthly'} />
          </div>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Cancel anytime · Bank-grade security · Not financial advice
          </p>
        </div>
      </div>
    </div>
  );
}
