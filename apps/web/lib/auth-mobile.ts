/**
 * Mobile authentication utilities. The RN app (apps/mobile) authenticates
 * against /api/auth/mobile/* and stores a short JWT we mint here (NextAuth's
 * database sessions are cookie-based and don't suit a native client). Bearer
 * token validation + user extraction for those mobile endpoints lives here.
 */

import { db } from '@genwel/db';
import { randomBytes } from 'crypto';
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

type BankConnectTarget = 'mobile' | 'web';

type BankConnectState = {
  userId: string;
  target: BankConnectTarget;
};

/** Create a session JWT for mobile auth (7 day expiry). */
export async function createToken(payload: TokenPayload): Promise<string> {
  return new SignJWT({ ...payload, kind: 'session' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getJwtSecret());
}

/** Create a short-lived magic-link token (15 minute expiry). */
export async function createMagicLinkToken(
  email: string,
  name?: string,
): Promise<string> {
  const normalizedEmail = email.trim().toLowerCase();
  const identifier = `mobile:${normalizedEmail}`;
  const tokenId = randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 15 * 60 * 1000);

  // Reuse NextAuth's verification-token table so the JWT is single-use without
  // adding a second auth-token model or migration. A newly requested link
  // invalidates older mobile links for the same address.
  await db.$transaction([
    db.verificationToken.deleteMany({ where: { identifier } }),
    db.verificationToken.create({
      data: { identifier, token: tokenId, expires },
    }),
  ]);

  return new SignJWT({
    email: normalizedEmail,
    name: name?.trim() || undefined,
    kind: 'magic-link',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setJti(tokenId)
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(getJwtSecret());
}

async function decodeToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    return payload;
  } catch (error) {
    console.error('[Auth] Token verification failed:', error);
    return null;
  }
}

/** Verify a mobile session token. Legacy pre-purpose tokens remain valid. */
export async function verifySessionToken(
  token: string,
): Promise<TokenPayload | null> {
  const payload = await decodeToken(token);
  if (
    !payload ||
    (payload.kind !== undefined && payload.kind !== 'session') ||
    typeof payload.id !== 'string' ||
    typeof payload.email !== 'string'
  ) {
    return null;
  }
  return { id: payload.id, email: payload.email };
}

/** Verify a short-lived email sign-in token. */
export async function verifyMagicLinkToken(
  token: string,
): Promise<{ email: string; name?: string } | null> {
  const payload = await decodeToken(token);
  if (
    !payload ||
    (payload.kind !== undefined && payload.kind !== 'magic-link') ||
    typeof payload.email !== 'string' ||
    typeof payload.jti !== 'string'
  ) {
    return null;
  }

  const consumed = await db.verificationToken.deleteMany({
    where: {
      identifier: `mobile:${payload.email.trim().toLowerCase()}`,
      token: payload.jti,
      expires: { gt: new Date() },
    },
  });
  if (consumed.count !== 1) return null;

  return {
    email: payload.email.trim().toLowerCase(),
    ...(typeof payload.name === 'string' ? { name: payload.name } : {}),
  };
}

/** Signed TrueLayer state binds the callback to a user and return surface. */
export async function createBankConnectState(
  userId: string,
  target: BankConnectTarget,
): Promise<string> {
  return new SignJWT({
    kind: 'bank-connect',
    target,
    nonce: randomBytes(16).toString('hex'),
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(getJwtSecret());
}

export async function verifyBankConnectState(
  token: string,
): Promise<BankConnectState | null> {
  const payload = await decodeToken(token);
  if (
    !payload ||
    payload.kind !== 'bank-connect' ||
    typeof payload.sub !== 'string' ||
    (payload.target !== 'web' && payload.target !== 'mobile')
  ) {
    return null;
  }
  return { userId: payload.sub, target: payload.target };
}

/** Extract the user id from the request's Bearer token, or null. */
export async function getUserIdFromToken(): Promise<string | null> {
  try {
    const headersList = await headers();
    const authorization = headersList.get('authorization');
    if (!authorization?.startsWith('Bearer ')) return null;

    const payload = await verifySessionToken(authorization.substring(7));
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
