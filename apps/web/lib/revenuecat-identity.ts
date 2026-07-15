export type RevenueCatIdentity = {
  app_user_id?: string;
  original_app_user_id?: string;
  aliases?: string[];
};

export type RevenueCatIdentityUser = {
  id: string;
  revenuecatUserId: string | null;
};

export const isRevenueCatAnonymousId = (value: string) =>
  value.startsWith('$RCAnonymousID:');

/**
 * Use one durable local subscription key per Genwel user. RevenueCat's
 * reconcile response and lifecycle webhooks can expose different transaction
 * identifiers for the same purchase; keying new rows by either identifier can
 * create competing subscription rows when those requests race.
 */
export const revenueCatSubscriptionExternalId = (userId: string) =>
  `rc:${userId}`;

/** All identities RevenueCat says belong to the customer, in preference order. */
export const revenueCatIdentityCandidates = (
  identity: RevenueCatIdentity,
): string[] => {
  const candidates = [
    identity.app_user_id,
    identity.original_app_user_id,
    ...(identity.aliases ?? []),
  ];

  return [
    ...new Set(
      candidates
        .map((candidate) => candidate?.trim())
        .filter((candidate): candidate is string => Boolean(candidate)),
    ),
  ];
};

/**
 * Prefer a direct Genwel user-id match over a legacy RevenueCat-id match. This
 * is important when an anonymous purchaser is later merged into a signed-in
 * customer and the webhook still uses the anonymous id as app_user_id.
 */
export const selectRevenueCatIdentityUser = <T extends RevenueCatIdentityUser>(
  users: T[],
  identity: RevenueCatIdentity,
): T | null => {
  const candidates = revenueCatIdentityCandidates(identity);
  for (const candidate of candidates) {
    const direct = users.find((user) => user.id === candidate);
    if (direct) return direct;
  }
  for (const candidate of candidates) {
    const linked = users.find((user) => user.revenuecatUserId === candidate);
    if (linked) return linked;
  }
  return null;
};
