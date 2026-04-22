import Link from 'next/link';
import { requireAdmin } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import AppNav from '@/components/AppNav';

export const dynamic = 'force-dynamic';

export default async function AdminQuestionsPage() {
  await requireAdmin();

  const questions = await prisma.question.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: { topic: true },
  });

  return (
    <>
      <AppNav />
      <main className="mx-auto flex max-w-3xl flex-col gap-6 p-6">
        <header className="flex items-center justify-between">
          <h1 className="text-3xl font-semibold">Questions</h1>
          <Link
            href="/admin/questions/new"
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm text-white dark:bg-white dark:text-black"
          >
            New question
          </Link>
        </header>
        <p className="text-sm text-neutral-500">Showing 100 most recent.</p>

        <ul className="divide-y divide-neutral-200 rounded-md border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
          {questions.map((q) => (
            <li key={q.id} className="p-3 text-sm">
              <div className="text-xs text-neutral-500">
                {q.section} · difficulty {q.difficulty} · {q.topic?.name ?? 'no topic'}
              </div>
              <div className="line-clamp-2">{q.stem}</div>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}
