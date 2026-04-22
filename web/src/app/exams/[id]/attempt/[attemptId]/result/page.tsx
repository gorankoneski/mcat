import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import AppNav from '@/components/AppNav';
import type { Section } from '@prisma/client';

export const dynamic = 'force-dynamic';

const SECTION_LABEL: Record<Section, string> = {
  CP: 'Chem/Phys',
  CARS: 'CARS',
  BB: 'Bio/Biochem',
  PS: 'Psych/Soc',
};

export default async function ResultPage({
  params,
}: {
  params: Promise<{ id: string; attemptId: string }>;
}) {
  const user = await requireUser();
  const { attemptId } = await params;

  const attempt = await prisma.attempt.findFirst({
    where: { id: attemptId, userId: user.id },
    include: {
      exam: {
        include: {
          questions: {
            orderBy: { order: 'asc' },
            include: {
              question: {
                include: {
                  topic: { include: { contentCategory: true } },
                },
              },
            },
          },
        },
      },
      answers: true,
    },
  });

  if (!attempt) notFound();

  const answerByQ = new Map(attempt.answers.map((a) => [a.questionId, a]));

  // Per-section breakdown + per-category weak-spots
  const sectionStats: Record<Section, { correct: number; total: number }> = {
    CP: { correct: 0, total: 0 },
    CARS: { correct: 0, total: 0 },
    BB: { correct: 0, total: 0 },
    PS: { correct: 0, total: 0 },
  };
  const byCategory = new Map<string, { code: string; name: string; correct: number; total: number }>();
  const wrongQuestions: typeof attempt.exam.questions = [];

  for (const eq of attempt.exam.questions) {
    const ans = answerByQ.get(eq.questionId);
    const correct = ans?.chosenIdx === eq.question.correctIdx;
    sectionStats[eq.section].total += 1;
    if (correct) sectionStats[eq.section].correct += 1;
    else wrongQuestions.push(eq);

    const cat = eq.question.topic?.contentCategory;
    if (cat) {
      const prev = byCategory.get(cat.code) ?? { code: cat.code, name: cat.name, correct: 0, total: 0 };
      prev.total += 1;
      if (correct) prev.correct += 1;
      byCategory.set(cat.code, prev);
    }
  }

  const scaled = {
    CP: attempt.scaledCP,
    CARS: attempt.scaledCARS,
    BB: attempt.scaledBB,
    PS: attempt.scaledPS,
  };
  const scaledTotal =
    [scaled.CP, scaled.CARS, scaled.BB, scaled.PS].every((x) => x !== null)
      ? (scaled.CP! + scaled.CARS! + scaled.BB! + scaled.PS!)
      : null;

  return (
    <>
      <AppNav />
      <main className="mx-auto flex max-w-3xl flex-col gap-8 p-6">
        <header>
          <h1 className="text-3xl font-semibold">Score card</h1>
          <p className="text-sm text-neutral-500">{attempt.exam.title}</p>
        </header>

        {scaledTotal !== null && (
          <div className="rounded-md border border-neutral-200 p-6 dark:border-neutral-800">
            <div className="text-sm text-neutral-500">Estimated scaled total</div>
            <div className="text-5xl font-semibold">{scaledTotal}</div>
            <div className="text-xs text-neutral-500">out of 528</div>
          </div>
        )}

        <section>
          <h2 className="mb-3 text-lg font-medium">By section</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(Object.keys(sectionStats) as Section[]).map((s) => {
              const st = sectionStats[s];
              if (st.total === 0) return null;
              const pct = Math.round((st.correct / st.total) * 100);
              return (
                <div
                  key={s}
                  className="rounded-md border border-neutral-200 p-4 dark:border-neutral-800"
                >
                  <div className="text-xs text-neutral-500">{SECTION_LABEL[s]}</div>
                  <div className="text-2xl font-semibold">{scaled[s] ?? '–'}</div>
                  <div className="text-xs text-neutral-500">
                    {st.correct}/{st.total} ({pct}%)
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {byCategory.size > 0 && (
          <section>
            <h2 className="mb-3 text-lg font-medium">By content category</h2>
            <ul className="divide-y divide-neutral-200 rounded-md border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
              {[...byCategory.values()]
                .sort((a, b) => a.correct / a.total - b.correct / b.total)
                .map((c) => {
                  const pct = Math.round((c.correct / c.total) * 100);
                  const weak = pct < 70;
                  return (
                    <li
                      key={c.code}
                      className="flex items-center justify-between p-3 text-sm"
                    >
                      <div>
                        <span className="font-mono text-neutral-500">{c.code}</span>{' '}
                        <span>{c.name}</span>
                      </div>
                      <div className={weak ? 'text-red-600' : 'text-neutral-600 dark:text-neutral-400'}>
                        {c.correct}/{c.total} ({pct}%)
                      </div>
                    </li>
                  );
                })}
            </ul>
          </section>
        )}

        {wrongQuestions.length > 0 && (
          <section>
            <h2 className="mb-3 text-lg font-medium">Missed questions</h2>
            <ul className="flex flex-col gap-4">
              {wrongQuestions.map((eq) => {
                const ans = answerByQ.get(eq.questionId);
                const choices = eq.question.choices as string[];
                const chosen = ans?.chosenIdx ?? null;
                return (
                  <li
                    key={eq.questionId}
                    className="rounded-md border border-neutral-200 p-4 dark:border-neutral-800"
                  >
                    <div className="text-xs text-neutral-500">
                      Q{eq.order} · {eq.section}
                    </div>
                    <div className="my-2">{eq.question.stem}</div>
                    <div className="text-sm">
                      Correct: <strong>{String.fromCharCode(65 + eq.question.correctIdx)}. {choices[eq.question.correctIdx]}</strong>
                    </div>
                    {chosen !== null && (
                      <div className="text-sm text-red-600">
                        Your answer: {String.fromCharCode(65 + chosen)}. {choices[chosen]}
                      </div>
                    )}
                    {eq.question.explanation && (
                      <div className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                        {eq.question.explanation}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        <div className="flex gap-3">
          <Link
            href="/counselor"
            className="rounded-md bg-neutral-900 px-4 py-2 text-white dark:bg-white dark:text-black"
          >
            Ask the Counselor about this →
          </Link>
          <Link
            href="/exams"
            className="rounded-md border border-neutral-300 px-4 py-2 dark:border-neutral-700"
          >
            Back to exams
          </Link>
        </div>
      </main>
    </>
  );
}
