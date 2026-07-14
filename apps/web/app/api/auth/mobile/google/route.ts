import { db } from '@genwel/db';
import { OAuth2Client } from 'google-auth-library';
import { createToken } from '@/lib/auth-mobile';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

/**
 * POST /api/auth/mobile/google — exchange a Google id token (from the RN app's
 * native Google Sign-In) for a Genwel session token.
 * Body: { idToken: string }
 */
export async function POST(req: Request) {
  try {
    if (!GOOGLE_CLIENT_ID) {
      return Response.json(
        { error: 'Google sign-in is not configured' },
        { status: 503, headers: corsHeaders('POST') },
      );
    }
    const { idToken } = await req.json();

    if (!idToken || typeof idToken !== 'string') {
      return Response.json(
        { error: 'idToken is required' },
        { status: 400, headers: corsHeaders('POST') },
      );
    }

    const ticket = await client.verifyIdToken({
      idToken,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload?.email || payload.email_verified !== true) {
      return Response.json(
        { error: 'Invalid token' },
        { status: 401, headers: corsHeaders('POST') },
      );
    }

    const email = payload.email.trim().toLowerCase();
    let user = await db.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        name: payload.name || email.split('@')[0],
      },
    });
    if (!user.name && payload.name) {
      user = await db.user.update({
        where: { id: user.id },
        data: { name: payload.name },
      });
    }

    const sessionToken = await createToken({
      email,
      id: user.id,
    });

    return Response.json(
      { sessionToken },
      { headers: corsHeaders('POST'), status: 200 },
    );
  } catch (error) {
    console.error('[Auth] Google mobile sign-in error:', error);
    return Response.json(
      { error: 'Bad request' },
      { status: 400, headers: corsHeaders('POST') },
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
