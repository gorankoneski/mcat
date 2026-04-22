import NextAuth from 'next-auth';
import Apple from 'next-auth/providers/apple';
import Nodemailer from 'next-auth/providers/nodemailer';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from './prisma';

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'database' },
  providers: [
    Apple({
      clientId: process.env.APPLE_CLIENT_ID,
      clientSecret: process.env.APPLE_CLIENT_SECRET,
    }),
    Nodemailer({
      server: process.env.EMAIL_SERVER,
      from: process.env.EMAIL_FROM,
    }),
  ],
  callbacks: {
    // Invite gate: only emails with a matching Invite row may sign in.
    async signIn({ user }) {
      if (!user.email) return false;
      const invite = await prisma.invite.findUnique({ where: { email: user.email } });
      if (!invite) return false;
      if (!invite.usedAt) {
        await prisma.invite.update({
          where: { id: invite.id },
          data: { usedAt: new Date() },
        });
      }
      return true;
    },
    async session({ session, user }) {
      if (session.user) {
        (session.user as { id?: string; role?: string }).id = user.id;
        (session.user as { id?: string; role?: string }).role = (user as { role?: string }).role;
      }
      return session;
    },
  },
  pages: {
    signIn: '/sign-in',
  },
});
