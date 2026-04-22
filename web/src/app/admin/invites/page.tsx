import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import AppNav from '@/components/AppNav';
import { Role } from '@prisma/client';

export const dynamic = 'force-dynamic';

export default async function AdminInvitesPage() {
  await requireAdmin();

  const invites = await prisma.invite.findMany({
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { email: true } } },
  });

  async function createInvite(formData: FormData) {
    'use server';
    await requireAdmin();
    const email = String(formData.get('email') ?? '').trim().toLowerCase();
    const isAdmin = formData.get('role') === 'ADMIN';
    if (!email || !email.includes('@')) return;
    await prisma.invite.upsert({
      where: { email },
      update: { role: isAdmin ? Role.ADMIN : Role.STUDENT },
      create: { email, role: isAdmin ? Role.ADMIN : Role.STUDENT },
    });
    revalidatePath('/admin/invites');
  }

  async function revokeInvite(formData: FormData) {
    'use server';
    await requireAdmin();
    const id = String(formData.get('id') ?? '');
    if (!id) return;
    await prisma.invite.delete({ where: { id } });
    revalidatePath('/admin/invites');
  }

  return (
    <>
      <AppNav />
      <main className="mx-auto flex max-w-3xl flex-col gap-6 p-6">
        <h1 className="text-3xl font-semibold">Invites</h1>

        <form action={createInvite} className="flex flex-col gap-3 rounded-md border border-neutral-200 p-4 dark:border-neutral-800">
          <div className="font-medium">Issue invite</div>
          <input
            type="email"
            name="email"
            required
            placeholder="user@example.com"
            className="rounded-md border border-neutral-300 bg-white px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900"
          />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="role" value="ADMIN" />
            Grant admin role
          </label>
          <button className="self-start rounded-md bg-neutral-900 px-4 py-2 text-sm text-white dark:bg-white dark:text-black">
            Create invite
          </button>
        </form>

        <ul className="divide-y divide-neutral-200 rounded-md border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
          {invites.map((i) => (
            <li key={i.id} className="flex items-center justify-between gap-3 p-3 text-sm">
              <div>
                <div className="font-medium">{i.email}</div>
                <div className="text-xs text-neutral-500">
                  {i.role} · {i.usedAt ? `Used ${i.usedAt.toLocaleDateString()}` : 'Pending'}
                </div>
              </div>
              <form action={revokeInvite}>
                <input type="hidden" name="id" value={i.id} />
                <button className="text-red-600 hover:underline">Revoke</button>
              </form>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}
