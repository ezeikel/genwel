import { db } from '@genwel/db';

/**
 * Permanently delete a user and cascaded Genwel data.
 *
 * Cascades (Prisma onDelete: Cascade): auth accounts/sessions, bank
 * connections → accounts → transactions, budgets, insights, subscriptions
 * and subscription events.
 *
 * Also clears pending email verification / magic-link tokens for the address.
 * Does not cancel App Store, Play Store, or Stripe subscriptions — those stay
 * with the store/provider until the user cancels them.
 */
export async function deleteAccountForUser(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true },
  });
  if (!user) return { error: 'Account not found' } as const;

  const email = user.email.trim().toLowerCase();

  await db.$transaction(async (tx) => {
    // Magic-link / NextAuth verification rows are keyed by email, not user id.
    await tx.verificationToken.deleteMany({
      where: {
        OR: [{ identifier: email }, { identifier: `mobile:${email}` }],
      },
    });

    await tx.user.delete({ where: { id: user.id } });
  });

  return {
    success: true as const,
    deletedUserId: user.id,
  };
}
