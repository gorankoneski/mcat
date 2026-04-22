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
      session.user.id = user.id;
      session.user.role = (user as { role: 'STUDENT' | 'ADMIN' }).role;
      return session;
    },
  },
  events: {
    // Apply role from the Invite when a new User is created.
    async createUser({ user }) {
      if (!user.email || !user.id) return;
      const invite = await prisma.invite.findUnique({ where: { email: user.email } });
      if (!invite) return;
      await prisma.user.update({
        where: { id: user.id },
        data: { role: invite.role, inviteId: invite.id },
      });
    },
  },
  pages: {
    signIn: '/sign-in',
  },
});
