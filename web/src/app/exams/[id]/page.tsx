import { notFound, redirect } from 'next/navigation';
import { requireUser } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import AppNav from '@/components/AppNav';

export const dynamic = 'force-dynamic';

export default async function ExamStartPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;

  const exam = await prisma.exam.findUnique({
    where: { id },
    include: { _count: { select: { questions: true } } },
  });
  if (!exam) notFound();

  async function beginAttempt() {
    'use server';
    const attempt = await prisma.attempt.create({
      data: { userId: user.id, examId: id },
    });
    redirect(`/exams/${id}/attempt/${attempt.id}`);
  }

  const estMinutes =
    exam.type === 'FULL_LENGTH' ? 450 : exam.type === 'SECTION' ? 95 : exam._count.questions * 2;

  return (
    <>
      <AppNav />
      <main className="mx-auto flex max-w-xl flex-col gap-6 p-6">
        <h1 className="text-3xl font-semibold">{exam.title}</h1>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <dt className="text-neutral-500">Type</dt>
          <dd>{exam.type}</dd>
          <dt className="text-neutral-500">Questions</dt>
          <dd>{exam._count.questions}</dd>
          <dt className="text-neutral-500">Estimated time</dt>
          <dd>{estMinutes} min</dd>
        </dl>

        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Once you start, a timer will count down. You can flag questions and
          review them before submitting.
        </p>

        <form action={beginAttempt}>
          <button
            type="submit"
            className="w-full rounded-md bg-neutral-900 px-4 py-3 text-white dark:bg-white dark:text-black"
          >
            Start attempt
          </button>
        </form>
      </main>
    </>
  );
}
