import { notFound, redirect } from 'next/navigation';
import { requireUser } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import AppNav from '@/components/AppNav';
import ExamRunner from './ExamRunner';

export const dynamic = 'force-dynamic';

export default async function AttemptPage({
  params,
}: {
  params: Promise<{ id: string; attemptId: string }>;
}) {
  const user = await requireUser();
  const { id, attemptId } = await params;

  const attempt = await prisma.attempt.findFirst({
    where: { id: attemptId, userId: user.id, examId: id },
    include: {
      exam: {
        include: {
          questions: {
            orderBy: { order: 'asc' },
            include: { question: true },
          },
        },
      },
      answers: true,
    },
  });

  if (!attempt) notFound();
  if (attempt.finishedAt) redirect(`/exams/${id}/attempt/${attemptId}/result`);

  const totalMinutes =
    attempt.exam.type === 'FULL_LENGTH'
      ? 450
      : attempt.exam.type === 'SECTION'
        ? 95
        : attempt.exam.questions.length * 2;

  const startedAt = attempt.startedAt.getTime();
  const deadline = startedAt + totalMinutes * 60_000;

  const initialAnswers = Object.fromEntries(
    attempt.answers.map((a) => [
      a.questionId,
      { chosenIdx: a.chosenIdx, flagged: a.flagged },
    ]),
  );

  const questions = attempt.exam.questions.map((eq) => ({
    id: eq.question.id,
    order: eq.order,
    section: eq.section,
    stem: eq.question.stem,
    choices: eq.question.choices as string[],
  }));

  return (
    <>
      <AppNav />
      <ExamRunner
        attemptId={attemptId}
        examId={id}
        title={attempt.exam.title}
        deadlineMs={deadline}
        questions={questions}
        initialAnswers={initialAnswers}
      />
    </>
  );
}
