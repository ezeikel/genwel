import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';

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

  if (!session?.user) {
    redirect('/signin?redirect=/dashboard');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardSidebar user={session.user} />
      <main className="lg:pl-64">
        <div className="px-4 py-8 sm:px-6 lg:px-8">{children}</div>
      </main>
    </div>
  );
}
