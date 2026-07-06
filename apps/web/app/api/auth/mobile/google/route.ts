import { db } from '@genwel/db';
import { OAuth2Client } from 'google-auth-library';
import { createToken } from '@/lib/auth-mobile';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * POST /api/auth/mobile/google — exchange a Google id token (from the RN app's
 * native Google Sign-In) for a Genwel session token.
 * Body: { idToken: string }
 */
export async function POST(req: Request) {
  try {
    const { idToken } = await req.json();

    if (!idToken) {
      return Response.json({ error: 'idToken is required' }, { status: 400 });
    }

    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload?.email) {
      return Response.json({ error: 'Invalid token' }, { status: 400 });
    }

    let user = await db.user.findUnique({ where: { email: payload.email } });
    if (!user) {
      user = await db.user.create({
        data: {
          email: payload.email,
          name: payload.name || payload.email.split('@')[0],
        },
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
    console.error('[Auth] Google mobile sign-in error:', error);
    return Response.json({ error: 'Bad request' }, { status: 400 });
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
