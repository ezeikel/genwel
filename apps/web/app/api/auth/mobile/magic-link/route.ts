import { NextRequest } from 'next/server';
import { Resend } from 'resend';
import { createMagicLinkToken } from '@/lib/auth-mobile';

// Construct the Resend client LAZILY (per request) — `new Resend(undefined)`
// throws when RESEND_API_KEY is unset, which would break `next build`'s
// page-data collection if done at module scope.
const getResend = () => new Resend(process.env.RESEND_API_KEY);

/**
 * POST /api/auth/mobile/magic-link — email a magic link that deep-links back
 * into the RN app. The token is short-lived (15 min); the app exchanges it for
 * a session token via /verify.
 * Body: { email: string }
 */
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || !email.includes('@')) {
      return Response.json(
        { error: 'Valid email is required' },
        { status: 400 },
      );
    }

    const token = await createMagicLinkToken(email);

    // Deep link into the Expo app (scheme `genwel`, see apps/mobile app config).
    const magicLinkUrl = `genwel://magic-link?token=${token}`;

    try {
      await getResend().emails.send({
        from: process.env.EMAIL_FROM || 'Genwel <no-reply@genwel.com>',
        to: email,
        subject: 'Sign in to Genwel',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
            <h1 style="font-weight: 800; letter-spacing: -0.02em;">Genwel</h1>
            <h2>Sign in to your account</h2>
            <p>Tap the button below to sign in. This link expires in 15 minutes.</p>
            <a href="${magicLinkUrl}" style="display: inline-block; background-color: #0a0a0a; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 20px 0;">
              Sign In
            </a>
            <p style="color: #6b6b66; font-size: 14px;">If you didn't request this, you can safely ignore it.</p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error('[Auth] Error sending magic link email:', emailError);
      return Response.json({ error: 'Failed to send email' }, { status: 500 });
    }

    return Response.json(
      { success: true, message: 'Magic link sent to your email' },
      { headers: corsHeaders('POST'), status: 200 },
    );
  } catch (error) {
    console.error('[Auth] Magic link error:', error);
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
