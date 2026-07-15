import {
  faBuildingColumns,
  faCrown,
  faEnvelope,
  faShieldHalved,
} from '@fortawesome/pro-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { Metadata } from 'next';
import Link from 'next/link';
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Support',
  description:
    'Get help with Genwel bank connections, subscriptions, privacy, and your account.',
  alternates: { canonical: 'https://genwel.com/support' },
};

const SUPPORT_EMAIL = 'developer@chewybytes.com';
const SUPPORT_HREF = 'mailto:developer@chewybytes.com?subject=Genwel%20Support';

const helpAreas = [
  {
    icon: faBuildingColumns,
    title: 'Bank connections',
    body: 'Tell us which bank you were connecting, roughly when it happened, and what you saw. Never email bank login details or full account numbers.',
  },
  {
    icon: faCrown,
    title: 'Genwel Pro',
    body: 'Include whether you subscribed on the web, App Store, or Google Play. Store purchases can be restored from the Genwel Pro screen.',
  },
  {
    icon: faShieldHalved,
    title: 'Account and privacy',
    body: 'For account access, correction, export, or deletion requests, contact us from the email address linked to your Genwel account where possible.',
  },
] as const;

export default function SupportPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen overflow-hidden bg-background px-4 pb-24 pt-28 sm:px-6 lg:px-8">
        <section className="relative mx-auto max-w-6xl">
          <div className="pointer-events-none absolute -right-32 -top-40 h-96 w-96 rounded-full bg-accent/15 blur-3xl" />
          <div className="pointer-events-none absolute -left-40 top-56 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />

          <div className="relative max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">
              Genwel support
            </p>
            <h1 className="mt-4 text-4xl font-bold tracking-[-0.04em] text-foreground sm:text-6xl">
              Help with your money view, without the runaround.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
              Send us the details below and we’ll help with your account, bank
              connection, or subscription. Genwel only uses read-only bank
              access and cannot move your money.
            </p>
          </div>

          <div className="relative mt-12 overflow-hidden rounded-[2rem] bg-primary px-6 py-8 text-primary-foreground shadow-[0_28px_70px_-38px_rgba(10,63,61,0.8)] sm:px-10 sm:py-10">
            <div className="absolute -right-16 -top-24 h-64 w-64 rounded-full border-[40px] border-primary-foreground/5" />
            <div className="relative flex flex-col justify-between gap-8 md:flex-row md:items-center">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">
                  Contact us
                </p>
                <h2 className="mt-3 text-2xl font-bold sm:text-3xl">
                  Tell us what happened.
                </h2>
                <p className="mt-3 max-w-2xl leading-7 text-primary-foreground/75">
                  Include your device type, Genwel version and build number,
                  what you were trying to do, and any exact error message.
                </p>
              </div>
              <Button
                asChild
                size="lg"
                variant="secondary"
                className="h-12 shrink-0 rounded-xl px-5"
              >
                <a href={SUPPORT_HREF}>
                  <FontAwesomeIcon icon={faEnvelope} />
                  Email support
                </a>
              </Button>
            </div>
          </div>

          <div className="relative mt-14 grid gap-5 md:grid-cols-3">
            {helpAreas.map((area) => (
              <article
                key={area.title}
                className="rounded-[1.75rem] border border-border bg-card p-6 shadow-[0_18px_48px_-38px_rgba(23,37,37,0.55)]"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-muted text-primary">
                  <FontAwesomeIcon icon={area.icon} size="lg" />
                </div>
                <h2 className="mt-5 text-lg font-semibold text-foreground">
                  {area.title}
                </h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {area.body}
                </p>
              </article>
            ))}
          </div>

          <div className="relative mt-14 grid gap-6 rounded-[2rem] border border-border bg-muted/45 p-6 sm:p-9 md:grid-cols-[1.15fr_0.85fr]">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground">
                Before you email
              </h2>
              <ul className="mt-5 space-y-3 text-sm leading-6 text-muted-foreground">
                <li>• Try Sync now once if balances look out of date.</li>
                <li>
                  • Check the app version and build number in More → Help &amp;
                  about.
                </li>
                <li>
                  • Attach a screenshot only after hiding balances, account
                  numbers, and other personal financial information.
                </li>
              </ul>
            </div>
            <div className="rounded-2xl border border-border bg-background p-5">
              <p className="text-sm font-semibold text-foreground">
                Security reminder
              </p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                We will never ask for your bank password, one-time passcode, or
                full card details. If you believe your bank account is at risk,
                contact your bank immediately.
              </p>
            </div>
          </div>

          <div className="relative mt-10 flex flex-col justify-between gap-4 border-t border-border pt-8 text-sm text-muted-foreground sm:flex-row sm:items-center">
            <p>
              Prefer to write directly?{' '}
              <a
                className="font-medium text-primary underline underline-offset-4"
                href={SUPPORT_HREF}
              >
                {SUPPORT_EMAIL}
              </a>
            </p>
            <p>
              Read our{' '}
              <Link
                className="font-medium text-primary underline underline-offset-4"
                href="/privacy"
              >
                Privacy Policy
              </Link>{' '}
              and{' '}
              <Link
                className="font-medium text-primary underline underline-offset-4"
                href="/terms"
              >
                Terms of Service
              </Link>
              .
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
