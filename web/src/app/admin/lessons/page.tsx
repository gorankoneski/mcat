import Link from 'next/link';
import { requireAdmin } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import AppNav from '@/components/AppNav';

export const dynamic = 'force-dynamic';

export default async function AdminLessonsPage() {
  await requireAdmin();

  const lessons = await prisma.lesson.findMany({
    orderBy: { updatedAt: 'desc' },
    include: { topic: { include: { contentCategory: true } } },
  });

  return (
    <>
      <AppNav />
      <main className="mx-auto flex max-w-3xl flex-col gap-6 p-6">
        <header className="flex items-center justify-between">
          <h1 className="text-3xl font-semibold">Lessons</h1>
          <Link
            href="/admin/lessons/new"
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm text-white dark:bg-white dark:text-black"
          >
            New lesson
          </Link>
        </header>

        {lessons.length === 0 ? (
          <p className="text-sm text-neutral-500">No lessons yet.</p>
        ) : (
          <ul className="divide-y divide-neutral-200 rounded-md border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
            {lessons.map((l) => (
              <li key={l.id} className="p-3 text-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <Link href={`/lessons/${l.slug}`} className="font-medium hover:underline">
                      {l.title}
                    </Link>
                    <div className="text-xs text-neutral-500">
                      {l.topic.contentCategory.section} · {l.topic.contentCategory.code} ·{' '}
                      {l.topic.contentCategory.name}
                    </div>
                  </div>
                  <span className="text-xs text-neutral-500">
                    {l.updatedAt.toLocaleDateString()}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
