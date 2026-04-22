// Usage: npx tsx scripts/invite.ts user@example.com [--admin]
// Creates an invite row so that email can sign in (app is invite-only).

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];
  const isAdmin = process.argv.includes('--admin');

  if (!email || !email.includes('@')) {
    console.error('Usage: tsx scripts/invite.ts <email> [--admin]');
    process.exit(1);
  }

  const invite = await prisma.invite.upsert({
    where: { email },
    update: { role: isAdmin ? 'ADMIN' : 'STUDENT' },
    create: { email, role: isAdmin ? 'ADMIN' : 'STUDENT' },
  });

  console.log(`✓ invited ${email} as ${invite.role} (code: ${invite.code})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
