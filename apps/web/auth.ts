import { PrismaAdapter } from '@auth/prisma-adapter';
import { db } from '@genwel/db';
import { render } from '@react-email/render';
import type { Account, NextAuthConfig, User } from 'next-auth';
import NextAuth from 'next-auth';
import Resend from 'next-auth/providers/resend';
import MagicLinkEmail from '@/components/emails/MagicLinkEmail';
import resendClient from '@/lib/resend';

const prismaAdapter = PrismaAdapter(db);

const config = {
  adapter: {
    ...prismaAdapter,
    // Wrap deleteSession to handle stale cookies gracefully.
    // The default adapter throws P2025 if the session doesn't exist.
    async deleteSession(sessionToken: string) {
      try {
        return await prismaAdapter.deleteSession!(sessionToken);
      } catch (error: unknown) {
        if (
          error &&
          typeof error === 'object' &&
          'code' in error &&
          error.code === 'P2025'
        )
          return null;
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
  },
  providers: [
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
    async signIn({
      account,
      email,
    }: {
      user: User;
      account: Account | null;
      email?: { verificationRequest?: boolean };
    }) {
      // Handle magic link verification requests
      if (email?.verificationRequest) {
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
  },
  secret: process.env.NEXTAUTH_SECRET,
} satisfies NextAuthConfig;

export const {
  handlers,
  auth,
  signIn,
  signOut,
  // @ts-expect-error - Type 'typeof import("next-auth")' has no call signatures
} = NextAuth(config);
