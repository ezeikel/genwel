import { faLock } from '@fortawesome/pro-duotone-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Link from 'next/link';
import { auth } from '@/auth';
import AskGenwelChat from '@/components/dashboard/ask/AskGenwelChat';
import { LogoMark } from '@/components/Logo';
import { getEntitlementsForUser } from '@/lib/entitlements';

export default async function AskGenwelPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const entitlements = await getEntitlementsForUser(session.user.id);

  if (!entitlements.features.askGenwel) {
    return (
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-8 text-2xl font-bold text-foreground">Ask Genwel</h1>
        <div className="rounded-2xl border border-border bg-card p-10 text-center shadow-sm">
          <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <LogoMark size={32} />
          </span>
          <h2 className="flex items-center justify-center gap-2 text-lg font-semibold text-foreground">
            <FontAwesomeIcon icon={faLock} className="h-4 w-4 text-primary" />
            Ask Genwel is a Pro feature
          </h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            Your own money assistant — ask anything about your spending,
            subscriptions and balances, and get answers from your real data in
            plain English.
          </p>
          <Link
            href="/pricing"
            className="mt-6 inline-flex items-center rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Upgrade to Pro — 7 days free
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-4 text-2xl font-bold text-foreground">Ask Genwel</h1>
      <AskGenwelChat />
    </div>
  );
}
