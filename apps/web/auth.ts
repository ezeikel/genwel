import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Resend from "next-auth/providers/resend";
import { render } from "@react-email/render";
import { db } from "@genwel/db";
import resendClient from "@/lib/resend";
import MagicLinkEmail from "@/components/emails/MagicLinkEmail";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(db),
  session: {
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  pages: {
    signIn: "/signin",
    verifyRequest: "/auth/verify-request",
  },
  providers: [
    Resend({
      from: process.env.DEFAULT_FROM_EMAIL || "Genwel <no-reply@genwel.com>",
      async sendVerificationRequest({ identifier: email, url }) {
        const emailHtml = await render(MagicLinkEmail({ magicLink: url }));

        await resendClient.emails.send({
          from: process.env.DEFAULT_FROM_EMAIL || "Genwel <no-reply@genwel.com>",
          to: email,
          subject: "Sign in to Genwel",
          html: emailHtml,
        });
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, email }) {
      // Handle magic link verification requests
      if (email?.verificationRequest) {
        return true;
      }

      // For Resend provider, create account if user exists
      if (account?.provider === "resend" && user.id) {
        const existingAccount = await db.account.findFirst({
          where: {
            userId: user.id,
            provider: "resend",
          },
        });

        if (!existingAccount) {
          await db.account.create({
            data: {
              userId: user.id,
              type: "email",
              provider: "resend",
              providerAccountId: user.email!,
            },
          });
        }
      }

      return true;
    },
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
});
