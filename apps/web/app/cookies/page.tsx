import type { Metadata } from 'next';
import Link from 'next/link';
import { CookieSettingsButton } from '@/components/CookieConsent';
import LegalDocument from '@/components/legal/LegalDocument';

export const metadata: Metadata = {
  title: 'Cookie Policy',
  description: 'How Genwel uses cookies and similar browser storage.',
  alternates: { canonical: 'https://genwel.com/cookies' },
};

const sectionHeading = 'text-xl font-semibold text-foreground';
const listStyle = 'mt-3 list-disc space-y-2 pl-6 text-muted-foreground';

export default function CookiesPage() {
  return (
    <LegalDocument
      title="Cookie Policy"
      description="This policy explains the cookies and similar browser technologies used by Genwel and the choices available to you."
    >
      <section>
        <h2 className={sectionHeading}>1. What these technologies are</h2>
        <p className="mt-3 text-muted-foreground">
          Cookies are small text files stored by a website. Similar technologies
          include local storage, which lets a browser remember information on a
          device. Some are essential to a service; others help measure and
          improve it.
        </p>
      </section>

      <section>
        <h2 className={sectionHeading}>2. Essential storage</h2>
        <p className="mt-3 text-muted-foreground">
          Genwel uses essential cookies and storage without optional analytics
          consent where they are needed to provide a service you request or keep
          it secure. These include:
        </p>
        <ul className={listStyle}>
          <li>
            Auth.js session, callback, and anti-forgery cookies used to sign you
            in securely and preserve the destination you requested. A signed-in
            session can last up to 30 days.
          </li>
          <li>
            A local-storage record of whether you chose optional analytics or
            essential storage only. We ask again after 180 days or when the
            consent version changes.
          </li>
          <li>
            Short-lived security and infrastructure data needed to deliver the
            site, balance requests, detect faults, and prevent abuse.
          </li>
        </ul>
      </section>

      <section>
        <h2 className={sectionHeading}>3. Optional PostHog analytics</h2>
        <p className="mt-3 text-muted-foreground">
          If you select{' '}
          <strong className="text-foreground">Accept analytics</strong>, we
          initialise PostHog to record page views, page exits, and product
          events we deliberately add. PostHog uses first-party local storage to
          distinguish a browser. We have disabled automatic click capture and
          session recording to reduce collection, especially on financial
          screens.
        </p>
        <p className="mt-3 text-muted-foreground">
          If you choose{' '}
          <strong className="text-foreground">Essential only</strong>, PostHog
          is not initialised. Withdrawing consent stops future capture and
          resets its stored browser identity.
        </p>
      </section>

      <section>
        <h2 className={sectionHeading}>4. Cookieless aggregate analytics</h2>
        <p className="mt-3 text-muted-foreground">
          We use Plausible Analytics and Vercel Web Analytics for aggregate site
          statistics. Their standard integrations do not set cookies or create
          persistent cross-site identifiers. They process limited information
          such as page path, referrer, device or browser category, and coarse
          location to produce aggregated reports. We do not use these services
          for advertising or cross-site profiling.
        </p>
      </section>

      <section>
        <h2 className={sectionHeading}>5. Diagnostics</h2>
        <p className="mt-3 text-muted-foreground">
          Sentry helps us identify crashes and security or performance faults.
          Session replay is disabled and Sentry is configured not to send
          default personal information. Diagnostic events may still include
          technical context needed to understand an error, so we minimise what
          application code attaches to them.
        </p>
      </section>

      <section>
        <h2 className={sectionHeading}>6. Change your choice</h2>
        <p className="mt-3 text-muted-foreground">
          You can change your optional analytics choice at any time. Browser
          controls can also block or delete cookies and local storage, although
          blocking essential session storage may stop sign-in from working.
        </p>
        <CookieSettingsButton className="mt-4 inline-flex rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted" />
      </section>

      <section>
        <h2 className={sectionHeading}>7. Contact and further information</h2>
        <p className="mt-3 text-muted-foreground">
          Email{' '}
          <a
            className="underline hover:text-foreground"
            href="mailto:developer@chewybytes.com"
          >
            developer@chewybytes.com
          </a>{' '}
          with questions. Our{' '}
          <Link className="underline hover:text-foreground" href="/privacy">
            Privacy Policy
          </Link>{' '}
          explains the wider use of personal data.
        </p>
      </section>
    </LegalDocument>
  );
}
