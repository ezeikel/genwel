'use client';

import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';

const displayName = (name?: string | null, email?: string | null) =>
  name?.split(' ')[0] || email?.split('@')[0] || 'Account';

const AuthNav = () => {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <div className="h-9 w-20" aria-hidden />;
  }

  if (!session?.user) {
    return (
      <Button variant="ghost" size="sm" asChild>
        <Link href="/signin">Log in</Link>
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/dashboard">
          {displayName(session.user.name, session.user.email)}
        </Link>
      </Button>
      <Button variant="ghost" size="sm" onClick={() => signOut()}>
        Sign out
      </Button>
    </div>
  );
};

export default AuthNav;
