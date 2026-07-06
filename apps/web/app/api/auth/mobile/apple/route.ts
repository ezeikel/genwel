import { db } from '@genwel/db';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { createToken } from '@/lib/auth-mobile';

/**
 * POST /api/auth/mobile/apple — exchange an Apple identity token (from the RN
 * app's Sign in with Apple) for a Genwel session token.
 * Body: { identityToken: string }
 *
 * The identity token is VERIFIED against Apple's public keys before we trust
 * anything in it: signature (Apple's JWKS), issuer (appleid.apple.com), audience
 * (our bundle id), and expiry are all checked. Never decode-and-trust.
 */

const APPLE_JWKS = createRemoteJWKSet(
  new URL('https://appleid.apple.com/auth/keys'),
);

// The audience Apple issued the token for = our app's bundle id. Accept any of
// the configured bundle ids (prod/preview/dev) so all builds authenticate.
const APPLE_AUDIENCES = (
  process.env.APPLE_BUNDLE_IDS ??
  'com.chewybytes.genwel.app,com.chewybytes.genwel.app.internal,com.chewybytes.genwel.app.dev'
)
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

export async function POST(req: Request) {
  try {
    const { identityToken } = await req.json();

    if (!identityToken || typeof identityToken !== 'string') {
      return Response.json(
        { error: 'identityToken is required' },
        { status: 400, headers: corsHeaders('POST') },
      );
    }

    let email: string | undefined;
    try {
      const { payload } = await jwtVerify(identityToken, APPLE_JWKS, {
        issuer: 'https://appleid.apple.com',
        audience: APPLE_AUDIENCES,
      });
      email = typeof payload.email === 'string' ? payload.email : undefined;
    } catch (error) {
      console.error('[Auth] Apple identity token verification failed:', error);
      return Response.json(
        { error: 'Invalid Apple token' },
        { status: 401, headers: corsHeaders('POST') },
      );
    }

    if (!email) {
      return Response.json(
        { error: 'Apple token has no email' },
        { status: 400, headers: corsHeaders('POST') },
      );
    }

    let user = await db.user.findUnique({ where: { email } });
    if (!user) {
      user = await db.user.create({
        data: {
          email,
          // Apple often withholds the name after the first authorisation.
          name: email.split('@')[0],
        },
      });
    }

    const sessionToken = await createToken({ email, id: user.id });

    return Response.json(
      { sessionToken },
      { headers: corsHeaders('POST'), status: 200 },
    );
  } catch (error) {
    console.error('[Auth] Apple mobile sign-in error:', error);
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
