import { PrismaAdapter } from '@auth/prisma-adapter';
import { db } from '@genwel/db';
import { render } from '@react-email/render';
import type { NextAuthConfig } from 'next-auth';
import NextAuth from 'next-auth';
import AppleProvider from 'next-auth/providers/apple';
import FacebookProvider from 'next-auth/providers/facebook';
import GoogleProvider from 'next-auth/providers/google';
import Resend from 'next-auth/providers/resend';
import MagicLinkEmail from '@/components/emails/MagicLinkEmail';
import { generateAppleClientSecret } from '@/lib/apple';
import resendClient from '@/lib/resend';

const prismaAdapter = PrismaAdapter(db);

// Apple's client secret is a short-lived ES256 JWT, generated at module init.
// Skipped (empty string) when any Apple env var is missing so dev/build still
// starts — the provider only throws if a user actually attempts Apple sign-in.
const appleClientSecret =
  process.env.APPLE_TEAM_ID &&
  process.env.APPLE_KEY_ID &&
  process.env.APPLE_CLIENT_ID &&
  process.env.APPLE_PRIVATE_KEY
    ? await generateAppleClientSecret({
        teamId: process.env.APPLE_TEAM_ID,
        keyId: process.env.APPLE_KEY_ID,
        clientId: process.env.APPLE_CLIENT_ID,
        privateKey: process.env.APPLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      })
    : '';

const config = {
  adapter: {
    ...prismaAdapter,
    // Wrap deleteSession to handle stale cookies gracefully.
    // The default adapter throws P2025 if the session doesn't exist.
    // @ts-expect-error - next-auth beta types deleteSession as a union
    // (Awaitable<AdapterSession|null|undefined> | Promise<void>) that an
    // arrow literal can't satisfy cleanly; runtime behaviour is correct.
    deleteSession: async (sessionToken: string) => {
      try {
        return await prismaAdapter.deleteSession?.(sessionToken);
      } catch (error: unknown) {
        if (
          error &&
          typeof error === 'object' &&
          'code' in error &&
          error.code === 'P2025'
        )
          return undefined;
        throw error;
      }
    },
  },
  session: {
    strategy: 'database',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  pages: {
    signIn: '/signin',
    verifyRequest: '/auth/verify-request',
    error: '/auth/error',
  },
  providers: [
    // OAuth providers are included only when their env is present, so the app
    // builds/runs as each provider's credentials get provisioned (Genwel-specific
    // OAuth apps) instead of throwing at boot. FACEBOOK_CONSUMER_APP_* is the
    // CONSUMER LOGIN app — keep it distinct from any business/posting app.
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
    ...(process.env.APPLE_CLIENT_ID && appleClientSecret
      ? [
          AppleProvider({
            clientId: process.env.APPLE_CLIENT_ID,
            clientSecret: appleClientSecret,
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
    ...(process.env.FACEBOOK_CONSUMER_APP_ID &&
    process.env.FACEBOOK_CONSUMER_APP_SECRET
      ? [
          FacebookProvider({
            clientId: process.env.FACEBOOK_CONSUMER_APP_ID,
            clientSecret: process.env.FACEBOOK_CONSUMER_APP_SECRET,
            allowDangerousEmailAccountLinking: true,
            authorization: { params: { scope: 'public_profile email' } },
          }),
        ]
      : []),
    Resend({
      from: process.env.DEFAULT_FROM_EMAIL || 'Genwel <no-reply@genwel.com>',
      async sendVerificationRequest({ identifier: email, url }) {
        const emailHtml = await render(MagicLinkEmail({ magicLink: url }));

        await resendClient.emails.send({
          from:
            process.env.DEFAULT_FROM_EMAIL || 'Genwel <no-reply@genwel.com>',
          to: email,
          subject: 'Sign in to Genwel',
          html: emailHtml,
        });
      },
    }),
  ],
  callbacks: {
    async signIn({ account, email }) {
      // Handle magic link verification requests
      if (email?.verificationRequest) {
        return true;
      }

      // OAuth sign-ins: the PrismaAdapter handles user + account creation, so
      // just allow them through (required or the OAuth providers are dead).
      if (
        account?.provider === 'google' ||
        account?.provider === 'apple' ||
        account?.provider === 'facebook'
      ) {
        return true;
      }

      if (account?.provider === 'resend') {
        const userEmail = account.providerAccountId;

        if (!userEmail) return false;

        const existingUser = await db.user.findUnique({
          where: { email: userEmail },
        });

        if (existingUser) {
          return true;
        }

        await db.user.create({
          data: {
            email: userEmail,
          },
        });

        return true;
      }

      return false;
    },
    // Expose the DB user id on the session so server/client code can read the
    // identity without a second roundtrip. With 'database' strategy the `user`
    // arg is the full DB row.
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
} satisfies NextAuthConfig;

// Provider availability computed on the server from the same env conditions the
// `providers` array uses above, so the sign-in UI can render exactly the buttons
// that won't 404. Passed as a prop into the client sign-in form — the flags must
// be derived here (server) rather than from NEXT_PUBLIC_* flags on the client.
export const configuredProviders = {
  google: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
  apple: !!(process.env.APPLE_CLIENT_ID && appleClientSecret),
  facebook: !!(
    process.env.FACEBOOK_CONSUMER_APP_ID &&
    process.env.FACEBOOK_CONSUMER_APP_SECRET
  ),
  resend: !!process.env.RESEND_API_KEY,
};

export const {
  handlers,
  auth,
  signIn,
  signOut,
  // @ts-expect-error - Type 'typeof import("next-auth")' has no call signatures
} = NextAuth(config);
