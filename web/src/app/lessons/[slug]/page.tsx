import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import AppNav from '@/components/AppNav';
import LessonContent from '@/components/LessonContent';

export const dynamic = 'force-dynamic';

export default async function LessonPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await requireUser();
  const { slug } = await params;

  const lesson = await prisma.lesson.findUnique({
    where: { slug },
    include: {
      topic: {
        include: {
          contentCategory: true,
          questions: { orderBy: { difficulty: 'asc' } },
        },
      },
    },
  });

  if (!lesson) notFound();

  return (
    <>
      <AppNav />
      <main className="mx-auto flex max-w-3xl flex-col gap-6 p-6">
        <div className="text-xs font-mono text-neutral-500">
          {lesson.topic.contentCategory.section} · {lesson.topic.contentCategory.code} ·{' '}
          {lesson.topic.contentCategory.name}
        </div>

        <LessonContent source={lesson.bodyMdx} />

        {lesson.topic.questions.length > 0 && (
          <section className="mt-8 border-t border-neutral-200 pt-6 dark:border-neutral-800">
            <h2 className="mb-3 text-lg font-medium">Practice questions for this topic</h2>
            <p className="mb-3 text-sm text-neutral-500">
              {lesson.topic.questions.length} questions available. Take them as a drill.
            </p>
            <Link
              href={`/exams?topic=${lesson.topic.slug}`}
              className="inline-flex rounded-md bg-neutral-900 px-4 py-2 text-sm text-white dark:bg-white dark:text-black"
            >
              Go to exams →
            </Link>
          </section>
        )}
      </main>
    </>
  );
}
