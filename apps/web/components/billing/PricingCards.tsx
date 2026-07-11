'use client';

import { faCheck } from '@fortawesome/pro-light-svg-icons';
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
      {/* Billing toggle */}
      <div className="mb-10 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => setAnnual(false)}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            !annual
              ? 'bg-black text-white'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Monthly
        </button>
        <button
          type="button"
          onClick={() => setAnnual(true)}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            annual ? 'bg-black text-white' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Annual
          <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
            Save 34%
          </span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Free */}
        <div className="flex flex-col rounded-2xl border border-gray-200 bg-white p-8">
          <h3 className="text-lg font-semibold text-gray-900">Free</h3>
          <p className="mt-1 text-sm text-gray-500">See your money clearly.</p>
          <p className="mt-6 text-4xl font-bold text-gray-900">£0</p>
          <p className="mt-1 text-sm text-gray-500">forever</p>
          <ul className="mt-8 flex flex-col gap-3">
            {FREE_FEATURES.map((f) => (
              <li
                key={f}
                className="flex items-start gap-3 text-sm text-gray-700"
              >
                <FontAwesomeIcon
                  icon={faCheck}
                  className="mt-0.5 h-4 w-4 shrink-0 text-gray-400"
                />
                {f}
              </li>
            ))}
          </ul>
          <a
            href="/dashboard"
            className="mt-8 flex w-full items-center justify-center rounded-xl border border-gray-300 px-6 py-3.5 font-semibold text-gray-900 transition-colors hover:bg-gray-50"
          >
            Get started free
          </a>
        </div>

        {/* Pro */}
        <div className="relative flex flex-col rounded-2xl border-2 border-black bg-white p-8 shadow-sm">
          <span className="absolute -top-3 left-8 rounded-full bg-black px-3 py-1 text-xs font-semibold text-white">
            Most popular
          </span>
          <h3 className="text-lg font-semibold text-gray-900">Pro</h3>
          <p className="mt-1 text-sm text-gray-500">
            Everything, plus the AI that beats Emma.
          </p>
          <div className="mt-6 flex items-baseline gap-1">
            <span className="text-4xl font-bold text-gray-900">{price}</span>
            <span className="text-gray-500">{per}</span>
          </div>
          <p className="mt-1 text-sm text-gray-500">{effective}</p>
          <ul className="mt-8 flex flex-col gap-3">
            {PRO_FEATURES.map((f) => (
              <li
                key={f}
                className="flex items-start gap-3 text-sm text-gray-700"
              >
                <FontAwesomeIcon
                  icon={faCheck}
                  className="mt-0.5 h-4 w-4 shrink-0 text-black"
                />
                {f}
              </li>
            ))}
          </ul>
          <div className="mt-8">
            <UpgradeButton billingPeriod={annual ? 'annual' : 'monthly'} />
          </div>
          <p className="mt-3 text-center text-xs text-gray-400">
            Cancel anytime · Bank-grade security · Not financial advice
          </p>
        </div>
      </div>
    </div>
  );
}
