'use server';

import { auth } from '@/auth';
import {
  type FixableProblemsResult,
  getFixableProblemsForUser,
} from '@/lib/fixable-problems-data';

export async function getFixableProblems(): Promise<
  FixableProblemsResult & { error?: string }
> {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      problems: [],
      totalSaving: 0,
      locked: false,
      lockedCount: 0,
      error: 'Unauthorized',
    };
  }

  return getFixableProblemsForUser(session.user.id);
}
