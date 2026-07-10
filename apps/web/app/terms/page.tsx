import type { Metadata } from 'next';
import Link from 'next/link';
import LegalDocument from '@/components/legal/LegalDocument';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'The terms that apply when you use Genwel.',
  alternates: { canonical: 'https://genwel.com/terms' },
};

const sectionHeading = 'text-xl font-semibold text-foreground';
const listStyle = 'mt-3 list-disc space-y-2 pl-6 text-muted-foreground';

export default function TermsPage() {
  return (
    <LegalDocument
      title="Terms of Service"
      description="These terms govern your use of Genwel. Please read them before creating an account or connecting financial data."
    >
      <section>
        <h2 className={sectionHeading}>1. About Genwel</h2>
        <p className="mt-3 text-muted-foreground">
          Genwel is provided by Chewy Bytes Limited, a company registered in
          England and Wales under company number 16443347. Our registered office
          is 71-75 Shelton Street, London, England, WC2H 9JQ. You can contact us
          at{' '}
          <a
            className="underline hover:text-foreground"
            href="mailto:developer@chewybytes.com"
          >
            developer@chewybytes.com
          </a>
          .
        </p>
      </section>

      <section>
        <h2 className={sectionHeading}>2. Eligibility and your account</h2>
        <p className="mt-3 text-muted-foreground">
          You must be at least 18 years old and legally able to enter a contract
          to use Genwel. You must provide accurate information, keep access to
          your email and sign-in providers secure, and tell us promptly if you
          believe your account has been compromised. You are responsible for
          activity performed through your account unless the law says otherwise.
        </p>
      </section>

      <section>
        <h2 className={sectionHeading}>3. Open Banking</h2>
        <p className="mt-3 text-muted-foreground">
          Genwel uses TrueLayer to request read-only account and transaction
          data after you authorise access with your bank. We do not receive your
          bank login credentials and cannot use this connection to move money.
          Your bank and TrueLayer may apply their own terms and privacy notices.
        </p>
        <p className="mt-3 text-muted-foreground">
          You can withdraw bank access through Genwel, your bank, or TrueLayer.
          Data already received may remain in your Genwel account until you
          delete it or ask us to do so, subject to our legal obligations.
        </p>
      </section>

      <section>
        <h2 className={sectionHeading}>4. Budgeting and AI guidance</h2>
        <p className="mt-3 text-muted-foreground">
          Genwel organises financial information and may generate categories,
          budgets, alerts, or suggestions using automated systems and AI. These
          outputs may be incomplete, delayed, or inaccurate and must not be your
          only basis for a financial decision.
        </p>
        <p className="mt-3 font-medium text-foreground">
          Genwel is a budgeting and information tool, not a financial adviser.
          Chewy Bytes Limited is not authorised by the Financial Conduct
          Authority to provide regulated financial advice. Nothing in Genwel is
          investment, tax, legal, credit, debt, or other regulated advice.
        </p>
        <p className="mt-3 text-muted-foreground">
          Consider your own circumstances and seek an appropriately authorised
          professional where needed. Always verify important information against
          your bank or original records.
        </p>
      </section>

      <section>
        <h2 className={sectionHeading}>5. Paid plans</h2>
        <p className="mt-3 text-muted-foreground">
          Some Genwel features may require a paid subscription. The price,
          billing period, trial terms, renewal terms, and included features will
          be shown before you subscribe. Subscriptions may renew automatically
          until cancelled. Cancelling stops future renewal but does not normally
          refund a current billing period unless applicable law or the relevant
          app store requires it.
        </p>
        <p className="mt-3 text-muted-foreground">
          Purchases made through Apple or Google are also governed by that
          store&apos;s billing, cancellation, and refund rules. Statutory
          consumer rights are not affected by these terms.
        </p>
      </section>

      <section>
        <h2 className={sectionHeading}>6. Acceptable use</h2>
        <p className="mt-3 text-muted-foreground">You must not:</p>
        <ul className={listStyle}>
          <li>
            use Genwel unlawfully, fraudulently, or to harm another person;
          </li>
          <li>
            access another person&apos;s account or data without permission;
          </li>
          <li>
            interfere with security, overload the service, introduce malicious
            code, or attempt to bypass access controls;
          </li>
          <li>
            scrape, reverse engineer, copy, or resell the service except where
            the law expressly permits it; or
          </li>
          <li>use automated access without our written permission.</li>
        </ul>
      </section>

      <section>
        <h2 className={sectionHeading}>7. Availability and changes</h2>
        <p className="mt-3 text-muted-foreground">
          We work to keep Genwel available, but banks, Open Banking providers,
          AI providers, app stores, networks, and maintenance can cause delays
          or outages. We may change, suspend, or retire features when reasonably
          necessary. If a change materially affects a paid service, we will
          provide notice where required.
        </p>
      </section>

      <section>
        <h2 className={sectionHeading}>8. Intellectual property</h2>
        <p className="mt-3 text-muted-foreground">
          Genwel and its software, branding, design, and content belong to Chewy
          Bytes Limited or our licensors. We grant you a personal,
          non-exclusive, non-transferable, revocable right to use the service
          for its intended purpose while these terms apply. You retain ownership
          of information you provide and grant us the rights needed to operate
          the service for you.
        </p>
      </section>

      <section>
        <h2 className={sectionHeading}>9. Liability</h2>
        <p className="mt-3 text-muted-foreground">
          Nothing in these terms excludes liability that cannot lawfully be
          excluded, including liability for death or personal injury caused by
          negligence, fraud, or your statutory consumer rights. Subject to that,
          we are not responsible for losses caused by inaccurate third-party or
          AI data, decisions made without independent verification, events
          outside our reasonable control, or uses of Genwel contrary to these
          terms.
        </p>
      </section>

      <section>
        <h2 className={sectionHeading}>10. Ending your use</h2>
        <p className="mt-3 text-muted-foreground">
          You may stop using Genwel, disconnect your bank, or request account
          deletion at any time. We may restrict or close an account where you
          materially breach these terms, create security or legal risk, or fail
          to pay an amount due, acting reasonably and giving notice where
          appropriate.
        </p>
      </section>

      <section>
        <h2 className={sectionHeading}>11. Governing law</h2>
        <p className="mt-3 text-muted-foreground">
          These terms are governed by the laws of England and Wales. Courts in
          the part of the UK where you live may also have jurisdiction, and any
          mandatory consumer protections that apply to you remain in force.
        </p>
      </section>

      <section>
        <h2 className={sectionHeading}>12. Changes and related policies</h2>
        <p className="mt-3 text-muted-foreground">
          We may update these terms and will give reasonable notice of material
          changes. Continued use after the effective date means the updated
          terms apply, except where fresh agreement is legally required. Please
          also read our{' '}
          <Link className="underline hover:text-foreground" href="/privacy">
            Privacy Policy
          </Link>{' '}
          and{' '}
          <Link className="underline hover:text-foreground" href="/cookies">
            Cookie Policy
          </Link>
          .
        </p>
      </section>
    </LegalDocument>
  );
}
