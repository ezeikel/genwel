import type { Metadata } from 'next';
import PricingCards from '@/components/billing/PricingCards';
import Footer from '@/components/Footer';
import Header from '@/components/Header';

export const metadata: Metadata = {
  title: 'Pricing — Genwel',
  description:
    'Genwel is free to start. Upgrade to Pro for unlimited bank connections, smart insights, and Ask Genwel — from £6.99/month.',
  alternates: { canonical: 'https://genwel.com/pricing' },
};

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-background">
      <Header />

      {/* Hero — soft accent wash behind the headline, matching the marketing site */}
      <section className="relative overflow-hidden pt-32 pb-12 md:pt-40 md:pb-16">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] bg-[radial-gradient(60%_100%_at_50%_0%,var(--accent)/18%,transparent_70%)]"
        />
        <div className="mx-auto max-w-3xl px-6 text-center">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.14em] text-accent-foreground/70">
            Pricing
          </p>
          <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground md:text-5xl">
            One plan. <span className="text-primary">Everything unlocked.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-balance text-lg text-muted-foreground">
            Free to start — connect your bank in minutes. Go Pro for unlimited
            accounts, smart insights, and a money assistant that actually knows
            where your money goes.
          </p>
        </div>
      </section>

      <section className="px-6 pb-24">
        <PricingCards />
      </section>

      <div className="mx-auto max-w-2xl px-6 pb-20 text-center">
        <p className="text-sm text-muted-foreground">
          Genwel is a trading name of Chewy Bytes Limited. We use bank-grade
          Open Banking (TrueLayer) with read-only access. Genwel is not a
          regulated financial service and does not provide financial advice.
        </p>
      </div>

      <Footer />
    </main>
  );
}
