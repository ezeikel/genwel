import type { Metadata } from 'next';
import PricingCards from '@/components/billing/PricingCards';

export const metadata: Metadata = {
  title: 'Pricing — Genwel',
  description:
    'Genwel is free to start. Upgrade to Pro for unlimited bank connections, AI insights, and Ask Genwel — from £6.99/month.',
  alternates: { canonical: 'https://genwel.com/pricing' },
};

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-16 md:py-24">
      <div className="mb-12 text-center">
        <h1 className="text-balance text-4xl font-bold text-gray-900 md:text-5xl">
          Simple pricing. Smarter than Emma.
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-balance text-lg text-gray-600">
          Start free with your bank connected in minutes. Upgrade when you want
          the full AI — unlimited connections, insights, and a money assistant
          that actually knows your spending.
        </p>
      </div>

      <PricingCards />

      <div className="mx-auto mt-16 max-w-2xl text-center">
        <p className="text-sm text-gray-500">
          Genwel is a trading name of Chewy Bytes Limited. We use bank-grade
          Open Banking (TrueLayer) with read-only access. Genwel is not a
          regulated financial service and does not provide financial advice.
        </p>
      </div>
    </div>
  );
}
