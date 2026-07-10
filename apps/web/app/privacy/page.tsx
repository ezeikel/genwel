import type { Metadata } from 'next';
import Link from 'next/link';
import LegalDocument from '@/components/legal/LegalDocument';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How Genwel collects, uses, shares, and protects personal data.',
  alternates: { canonical: 'https://genwel.com/privacy' },
};

const sectionHeading = 'text-xl font-semibold text-foreground';
const listStyle = 'mt-3 list-disc space-y-2 pl-6 text-muted-foreground';

export default function PrivacyPage() {
  return (
    <LegalDocument
      title="Privacy Policy"
      description="This notice explains how Chewy Bytes Limited, trading as Genwel, handles your personal data when you use our website, web app, or mobile apps."
    >
      <section>
        <h2 className={sectionHeading}>1. Who we are</h2>
        <p className="mt-3 text-muted-foreground">
          Chewy Bytes Limited is the controller of the personal data described
          in this notice. We are registered in England and Wales under company
          number 16443347, with a registered office at 71-75 Shelton Street,
          London, England, WC2H 9JQ. Genwel is our personal budgeting product.
        </p>
        <p className="mt-3 text-muted-foreground">
          Contact us about privacy at{' '}
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
        <h2 className={sectionHeading}>2. The data we collect</h2>
        <ul className={listStyle}>
          <li>
            <strong className="text-foreground">Account data:</strong> your
            name, email address, profile image, authentication provider, and
            account identifiers.
          </li>
          <li>
            <strong className="text-foreground">Open Banking data:</strong>{' '}
            connected bank and account details, balances, transaction dates,
            amounts, descriptions, merchants, and categories supplied through
            TrueLayer after you authorise access.
          </li>
          <li>
            <strong className="text-foreground">Budgeting data:</strong> the
            budgets, preferences, categories, and goals you create, together
            with generated insights and suggestions.
          </li>
          <li>
            <strong className="text-foreground">Technical data:</strong> app and
            browser information, approximate location derived from an IP
            address, diagnostics, security events, and how the service is used.
          </li>
          <li>
            <strong className="text-foreground">Communications:</strong>{' '}
            messages and support requests you send to us.
          </li>
        </ul>
      </section>

      <section>
        <h2 className={sectionHeading}>3. Where the data comes from</h2>
        <p className="mt-3 text-muted-foreground">
          We receive data directly from you, from the sign-in provider you
          choose, from TrueLayer and your bank when you connect an account, and
          from the devices and services used to access Genwel. We only request
          Open Banking data after you complete the bank&apos;s authorisation
          flow.
        </p>
      </section>

      <section>
        <h2 className={sectionHeading}>4. How and why we use it</h2>
        <ul className={listStyle}>
          <li>
            <strong className="text-foreground">Contract:</strong> to create and
            secure your account, connect authorised accounts, synchronise
            transactions, provide budgets and insights, and deliver paid
            features you request.
          </li>
          <li>
            <strong className="text-foreground">Legitimate interests:</strong>{' '}
            to keep Genwel reliable and secure, prevent misuse, diagnose faults,
            understand aggregate service performance, and improve the product.
            We balance these interests against your rights.
          </li>
          <li>
            <strong className="text-foreground">Consent:</strong> for optional
            PostHog product analytics and any marketing communication you
            actively request. You can withdraw consent at any time.
          </li>
          <li>
            <strong className="text-foreground">Legal obligation:</strong> to
            meet applicable legal, accounting, security, and regulatory
            requirements and respond to lawful requests.
          </li>
        </ul>
      </section>

      <section>
        <h2 className={sectionHeading}>5. AI-powered features</h2>
        <p className="mt-3 text-muted-foreground">
          Genwel uses AI providers, currently Google and OpenAI, to categorise
          transactions and create budgeting suggestions and spending insights.
          Categorisation may include a transaction identifier, merchant or
          description, amount, and existing category. Suggestions and insights
          generally use aggregated spending totals, comparisons, and budgets. We
          do not send your bank login credentials or TrueLayer access tokens to
          AI models.
        </p>
        <p className="mt-3 text-muted-foreground">
          AI output can be incomplete or wrong. It is informational guidance,
          not regulated financial advice, and you remain responsible for any
          decision you make. Genwel does not make solely automated decisions
          that have legal or similarly significant effects on you.
        </p>
      </section>

      <section>
        <h2 className={sectionHeading}>6. Who we share data with</h2>
        <p className="mt-3 text-muted-foreground">
          We use service providers only where needed to operate Genwel. These
          include TrueLayer for Open Banking; Neon for database hosting; Vercel
          for hosting and aggregate web analytics; Resend for authentication
          email; Apple, Google, and Facebook when you choose their sign-in
          service; OpenAI and Google for AI features; Sentry for diagnostics;
          Plausible for cookieless aggregate analytics; and PostHog for optional
          product analytics after consent.
        </p>
        <p className="mt-3 text-muted-foreground">
          Providers act under their own terms or our processing arrangements. We
          may also disclose data when required by law, to protect users or the
          service, or as part of a corporate transaction with appropriate
          safeguards. We do not sell your personal data.
        </p>
      </section>

      <section>
        <h2 className={sectionHeading}>7. International transfers</h2>
        <p className="mt-3 text-muted-foreground">
          Some providers may process data outside the UK. Where required, we
          rely on UK adequacy regulations or contractual and organisational
          safeguards designed to protect transferred data. Contact us if you
          would like more information about the safeguards relevant to your
          data.
        </p>
      </section>

      <section>
        <h2 className={sectionHeading}>8. Retention and deletion</h2>
        <p className="mt-3 text-muted-foreground">
          We keep account and financial data while your account is active and
          for only as long afterwards as reasonably needed to provide the
          service, resolve disputes, maintain security, and meet legal duties.
          The precise period depends on the type of record and why it is held.
          Backups and security logs are deleted or overwritten on their normal
          rotation schedule.
        </p>
        <p className="mt-3 text-muted-foreground">
          You can disconnect a bank account in Genwel. To request deletion of
          your Genwel account and associated data, email us using the address
          above. We may retain limited records where the law requires it.
        </p>
      </section>

      <section>
        <h2 className={sectionHeading}>9. Your rights</h2>
        <p className="mt-3 text-muted-foreground">
          Depending on the circumstances, UK data protection law may give you
          rights to access, correct, erase, restrict, or receive a copy of your
          data, and to object to some processing. Where processing is based on
          consent, you can withdraw it without affecting earlier lawful use.
        </p>
        <p className="mt-3 font-medium text-foreground">
          You have the right to object to processing based on our legitimate
          interests. Tell us what you object to and why, and we will assess the
          request under applicable law.
        </p>
        <p className="mt-3 text-muted-foreground">
          Contact us to exercise a right. You can also complain to the UK
          Information Commissioner&apos;s Office at{' '}
          <a
            className="underline hover:text-foreground"
            href="https://ico.org.uk/make-a-complaint/"
          >
            ico.org.uk/make-a-complaint
          </a>
          .
        </p>
      </section>

      <section>
        <h2 className={sectionHeading}>10. Security and children</h2>
        <p className="mt-3 text-muted-foreground">
          We use access controls, encryption in transit, provider security
          controls, and monitoring intended to protect personal data. No online
          service can guarantee absolute security. Genwel is intended for people
          aged 18 or over and is not directed at children.
        </p>
      </section>

      <section>
        <h2 className={sectionHeading}>11. Changes to this notice</h2>
        <p className="mt-3 text-muted-foreground">
          We will update this page when our practices or legal obligations
          change. Material changes may also be shown in the product or sent to
          your account email. See our{' '}
          <Link className="underline hover:text-foreground" href="/cookies">
            Cookie Policy
          </Link>{' '}
          for browser-storage details.
        </p>
      </section>
    </LegalDocument>
  );
}
