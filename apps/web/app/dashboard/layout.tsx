import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';
import SyncTrigger from '@/components/dashboard/SyncTrigger';
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
    <div className="min-h-screen bg-muted">
      <SyncTrigger />
      <DashboardSidebar user={session.user} isPro={entitlements.hasAccess} />
      <main className="lg:pl-64">
        <div className="px-4 py-8 sm:px-6 lg:px-8">{children}</div>
      </main>
    </div>
  );
}
