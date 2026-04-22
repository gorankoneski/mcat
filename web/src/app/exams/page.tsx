import Link from 'next/link';
import { requireUser } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import AppNav from '@/components/AppNav';

export const dynamic = 'force-dynamic';

const TYPE_LABEL = {
  FULL_LENGTH: 'Full length',
  SECTION: 'Section',
  DRILL: 'Drill',
} as const;

export default async function ExamsPage() {
  await requireUser();

  const exams = await prisma.exam.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { questions: true } } },
  });

  return (
    <>
      <AppNav />
      <main className="mx-auto flex max-w-3xl flex-col gap-6 p-6">
        <header>
          <h1 className="text-3xl font-semibold">Exams</h1>
          <p className="text-sm text-neutral-500">Pick a simulator to begin.</p>
        </header>

        {exams.length === 0 ? (
          <p className="text-sm text-neutral-500">
            No exams available. An admin needs to create one.
          </p>
        ) : (
          <ul className="divide-y divide-neutral-200 rounded-md border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
            {exams.map((e) => (
              <li key={e.id} className="flex items-center justify-between p-4">
                <div>
                  <div className="font-medium">{e.title}</div>
                  <div className="text-xs text-neutral-500">
                    {TYPE_LABEL[e.type]} · {e._count.questions} questions
                  </div>
                </div>
                <Link
                  href={`/exams/${e.id}`}
                  className="rounded-md bg-neutral-900 px-4 py-2 text-sm text-white dark:bg-white dark:text-black"
                >
                  Start →
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
