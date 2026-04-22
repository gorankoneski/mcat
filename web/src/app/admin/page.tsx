import Link from 'next/link';
import { requireAdmin } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import AppNav from '@/components/AppNav';

export const dynamic = 'force-dynamic';

export default async function AdminHome() {
  await requireAdmin();

  const [users, invites, lessons, questions, exams] = await Promise.all([
    prisma.user.count(),
    prisma.invite.count(),
    prisma.lesson.count(),
    prisma.question.count(),
    prisma.exam.count(),
  ]);

  return (
    <>
      <AppNav />
      <main className="mx-auto flex max-w-3xl flex-col gap-6 p-6">
        <h1 className="text-3xl font-semibold">Admin</h1>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Stat label="Users" value={users} />
          <Stat label="Invites" value={invites} />
          <Stat label="Lessons" value={lessons} />
          <Stat label="Questions" value={questions} />
          <Stat label="Exams" value={exams} />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <AdminLink href="/admin/invites" label="Manage invites" />
          <AdminLink href="/admin/lessons" label="Manage lessons" />
          <AdminLink href="/admin/questions" label="Manage questions" />
          <AdminLink href="/admin/exams" label="Manage exams" />
        </div>
      </main>
    </>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-neutral-200 p-4 dark:border-neutral-800">
      <div className="text-sm text-neutral-500">{label}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  );
}

function AdminLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-md border border-neutral-200 p-4 hover:border-neutral-400 dark:border-neutral-800 dark:hover:border-neutral-600"
    >
      {label} →
    </Link>
  );
}
