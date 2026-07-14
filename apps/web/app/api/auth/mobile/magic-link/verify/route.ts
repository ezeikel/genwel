import { db } from '@genwel/db';
import { NextRequest } from 'next/server';
import { createToken, verifyMagicLinkToken } from '@/lib/auth-mobile';

/**
 * POST /api/auth/mobile/magic-link/verify — exchange a magic-link token (15 min)
 * for a session token (7 days). Called by the RN app after it handles the
 * `genwel://magic-link?token=…` deep link.
 * Body: { token: string }
 */
export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return Response.json({ error: 'Token is required' }, { status: 400 });
    }

    const payload = await verifyMagicLinkToken(token);
    if (!payload?.email) {
      return Response.json(
        { error: 'Invalid or expired token' },
        { status: 401 },
      );
    }

    let user = await db.user.findUnique({ where: { email: payload.email } });
    if (!user) {
      user = await db.user.create({
        data: {
          email: payload.email,
          name: payload.name?.trim() || null,
        },
      });
    } else if (!user.name && payload.name?.trim()) {
      user = await db.user.update({
        where: { id: user.id },
        data: { name: payload.name.trim() },
      });
    }

    const sessionToken = await createToken({
      email: payload.email,
      id: user.id,
    });

    return Response.json(
      { sessionToken },
      { headers: corsHeaders('POST'), status: 200 },
    );
  } catch (error) {
    console.error('[Auth] Magic link verification error:', error);
    return Response.json(
      { error: 'Invalid or expired token' },
      { status: 401 },
    );
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 200, headers: corsHeaders('POST') });
}

const corsHeaders = (methods: string) => ({
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': `${methods}, OPTIONS`,
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json',
});
