import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';
import MobileHeaderMenu from '@/components/dashboard/MobileHeaderMenu';
import MobileTabBar from '@/components/dashboard/MobileTabBar';
import NamePrompt from '@/components/dashboard/NamePrompt';
import SyncTrigger from '@/components/dashboard/SyncTrigger';
import Logo from '@/components/Logo';
import { getEntitlementsForUser } from '@/lib/entitlements';

export const metadata = {
  title: 'Dashboard - Genwel',
  description: 'Manage your finances with Genwel',
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/signin?redirect=/dashboard');
  }

  const entitlements = await getEntitlementsForUser(session.user.id);

  return (
    <div className="min-h-screen bg-background">
      <SyncTrigger />
      {!session.user.name && <NamePrompt userId={session.user.id} />}
      <DashboardSidebar user={session.user} isPro={entitlements.hasAccess} />

      {/* Mobile top bar — logo left, account menu right (Emma-style). Primary
          nav lives in the floating tab bar; the rest is under the avatar. */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-card/95 px-4 backdrop-blur lg:hidden">
        <Link href="/dashboard" aria-label="Genwel home">
          <Logo size={26} />
        </Link>
        <MobileHeaderMenu user={session.user} isPro={entitlements.hasAccess} />
      </header>

      <main className="lg:pl-64">
        {/* pb-28 on mobile clears the floating bottom tab bar */}
        <div className="px-4 py-6 pb-28 sm:px-6 lg:px-8 lg:py-8 lg:pb-8">
          {children}
        </div>
      </main>

      <MobileTabBar />
    </div>
  );
}
