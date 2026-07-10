/**
 * Mobile authentication utilities. The RN app (apps/mobile) authenticates
 * against /api/auth/mobile/* and stores a short JWT we mint here (NextAuth's
 * database sessions are cookie-based and don't suit a native client). Bearer
 * token validation + user extraction for those mobile endpoints lives here.
 */

import { db } from '@genwel/db';
import { jwtVerify, SignJWT } from 'jose';
import { headers } from 'next/headers';

// Resolve the signing secret LAZILY — a missing secret must fail loudly, but
// only when a token op actually runs (at request time), never at module-eval /
// build time (which would break `next build`'s page-data collection for any
// route that imports this module). No insecure fallback.
const getJwtSecret = (): Uint8Array => {
  const secret = process.env.MOBILE_AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error(
      'MOBILE_AUTH_SECRET or NEXTAUTH_SECRET environment variable must be set',
    );
  }
  return new TextEncoder().encode(secret);
};

export type TokenPayload = {
  email: string;
  id: string;
};

/** Create a session JWT for mobile auth (7 day expiry). */
export async function createToken(payload: TokenPayload): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getJwtSecret());
}

/** Create a short-lived magic-link token (15 minute expiry). */
export async function createMagicLinkToken(email: string): Promise<string> {
  return new SignJWT({ email })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(getJwtSecret());
}

/** Verify and decode a JWT minted by createToken / createMagicLinkToken. */
export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    return payload as unknown as TokenPayload;
  } catch (error) {
    console.error('[Auth] Token verification failed:', error);
    return null;
  }
}

/** Extract the user id from the request's Bearer token, or null. */
export async function getUserIdFromToken(): Promise<string | null> {
  try {
    const headersList = await headers();
    const authorization = headersList.get('authorization');
    if (!authorization?.startsWith('Bearer ')) return null;

    const payload = await verifyToken(authorization.substring(7));
    return payload?.id ?? null;
  } catch (error) {
    console.error('[Auth] Error extracting user from token:', error);
    return null;
  }
}

/** Full user from the request's Bearer token, or null. */
export async function getCurrentUserFromToken() {
  const userId = await getUserIdFromToken();
  if (!userId) return null;

  return db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      emailVerified: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}
