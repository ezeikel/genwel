import { db } from '@genwel/db';
import { createToken } from '@/lib/auth-mobile';

/**
 * POST /api/auth/mobile/facebook — exchange a Facebook access token (from the RN
 * app's native Facebook Login) for a Genwel session token.
 * Body: { accessToken: string }
 *
 * The access token is VERIFIED against Facebook two ways before we trust it:
 *   1. debug_token (with the app's own <appId>|<appSecret> token) confirms the
 *      token was issued for OUR app and is valid — never decode-and-trust.
 *   2. /me?fields=id,name,email returns the profile we key the user on.
 * FACEBOOK_CONSUMER_APP_ID / FACEBOOK_CONSUMER_APP_SECRET are the standardised
 * env names shared across all Chewy Bytes apps (the Meta CONSUMER LOGIN app).
 */

const FACEBOOK_APP_ID = process.env.FACEBOOK_CONSUMER_APP_ID;
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_CONSUMER_APP_SECRET;

export async function POST(req: Request) {
  try {
    if (!FACEBOOK_APP_ID || !FACEBOOK_APP_SECRET) {
      return Response.json(
        { error: 'Facebook sign-in is not configured' },
        { status: 503, headers: corsHeaders('POST') },
      );
    }

    const { accessToken } = await req.json();

    if (!accessToken || typeof accessToken !== 'string') {
      return Response.json(
        { error: 'accessToken is required' },
        { status: 400, headers: corsHeaders('POST') },
      );
    }

    // 1. Verify the token was issued for OUR app (guards against a token minted
    //    for a different app being replayed here).
    const appToken = `${FACEBOOK_APP_ID}|${FACEBOOK_APP_SECRET}`;
    const debugRes = await fetch(
      `https://graph.facebook.com/debug_token?input_token=${encodeURIComponent(
        accessToken,
      )}&access_token=${encodeURIComponent(appToken)}`,
    );
    const debug = (await debugRes.json()) as {
      data?: { is_valid?: boolean; app_id?: string };
    };
    if (!debug.data?.is_valid || debug.data.app_id !== FACEBOOK_APP_ID) {
      return Response.json(
        { error: 'Invalid Facebook token' },
        { status: 401, headers: corsHeaders('POST') },
      );
    }

    // 2. Fetch the profile we key the user on.
    const meRes = await fetch(
      `https://graph.facebook.com/me?fields=id,name,email&access_token=${encodeURIComponent(
        accessToken,
      )}`,
    );
    const me = (await meRes.json()) as {
      email?: string;
      name?: string;
      error?: unknown;
    };
    if (me.error || !me.email) {
      return Response.json(
        { error: 'Facebook token has no email' },
        { status: 400, headers: corsHeaders('POST') },
      );
    }

    const email = me.email.trim().toLowerCase();
    let user = await db.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        name: me.name || email.split('@')[0],
      },
    });
    if (!user.name && me.name) {
      user = await db.user.update({
        where: { id: user.id },
        data: { name: me.name },
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
    console.error('[Auth] Facebook mobile sign-in error:', error);
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
