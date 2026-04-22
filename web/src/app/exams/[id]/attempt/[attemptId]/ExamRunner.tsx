'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

type Question = {
  id: string;
  order: number;
  section: string;
  stem: string;
  choices: string[];
};

type AnswerState = { chosenIdx: number | null; flagged: boolean };

export default function ExamRunner({
  attemptId,
  examId,
  title,
  deadlineMs,
  questions,
  initialAnswers,
}: {
  attemptId: string;
  examId: string;
  title: string;
  deadlineMs: number;
  questions: Question[];
  initialAnswers: Record<string, AnswerState>;
}) {
  const router = useRouter();
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerState>>(() => {
    const seeded = { ...initialAnswers };
    for (const q of questions) {
      if (!seeded[q.id]) seeded[q.id] = { chosenIdx: null, flagged: false };
    }
    return seeded;
  });
  const [remainingMs, setRemainingMs] = useState(() => Math.max(0, deadlineMs - Date.now()));
  const [reviewMode, setReviewMode] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const questionStartRef = useRef<number>(Date.now());

  const current = questions[idx];
  const currentAnswer = answers[current.id];

  // Countdown timer
  useEffect(() => {
    const t = setInterval(() => {
      setRemainingMs(Math.max(0, deadlineMs - Date.now()));
    }, 1000);
    return () => clearInterval(t);
  }, [deadlineMs]);

  // Auto-submit when time runs out
  useEffect(() => {
    if (remainingMs === 0 && !submitting) {
      void finish();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remainingMs]);

  // Reset per-question timer when navigating
  useEffect(() => {
    questionStartRef.current = Date.now();
  }, [idx]);

  const persist = useCallback(
    async (questionId: string, patch: Partial<AnswerState>) => {
      const next = { ...answers[questionId], ...patch };
      setAnswers((prev) => ({ ...prev, [questionId]: next }));
      await fetch(`/api/attempts/${attemptId}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId,
          chosenIdx: next.chosenIdx,
          flagged: next.flagged,
          timeMs: Date.now() - questionStartRef.current,
        }),
      });
    },
    [answers, attemptId],
  );

  const choose = (i: number) => persist(current.id, { chosenIdx: i });
  const toggleFlag = () => persist(current.id, { flagged: !currentAnswer.flagged });

  const finish = async () => {
    setSubmitting(true);
    await fetch(`/api/attempts/${attemptId}/finish`, { method: 'POST' });
    router.push(`/exams/${examId}/attempt/${attemptId}/result`);
  };

  const answered = useMemo(
    () => questions.filter((q) => answers[q.id]?.chosenIdx !== null).length,
    [answers, questions],
  );
  const flagged = useMemo(
    () => questions.filter((q) => answers[q.id]?.flagged).length,
    [answers, questions],
  );

  const mm = Math.floor(remainingMs / 60_000);
  const ss = Math.floor((remainingMs % 60_000) / 1000)
    .toString()
    .padStart(2, '0');
  const timeClass = remainingMs < 5 * 60_000 ? 'text-red-600' : 'text-neutral-700 dark:text-neutral-300';

  if (reviewMode) {
    return (
      <main className="mx-auto max-w-3xl p-6">
        <h1 className="text-2xl font-semibold">Review — {title}</h1>
        <div className="my-4 text-sm text-neutral-500">
          {answered} answered · {flagged} flagged · {questions.length - answered} blank
        </div>
        <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
          {questions.map((q, i) => {
            const a = answers[q.id];
            const base = 'rounded-md border px-2 py-2 text-sm';
            const style = a.flagged
              ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950'
              : a.chosenIdx !== null
                ? 'border-green-500 bg-green-50 dark:bg-green-950'
                : 'border-neutral-300 dark:border-neutral-700';
            return (
              <button
                key={q.id}
                onClick={() => {
                  setIdx(i);
                  setReviewMode(false);
                }}
                className={`${base} ${style}`}
              >
                {q.order}
              </button>
            );
          })}
        </div>
        <div className="mt-6 flex gap-3">
          <button
            onClick={() => setReviewMode(false)}
            className="rounded-md border border-neutral-300 px-4 py-2 dark:border-neutral-700"
          >
            Back to exam
          </button>
          <button
            onClick={finish}
            disabled={submitting}
            className="rounded-md bg-red-600 px-4 py-2 text-white disabled:opacity-50"
          >
            {submitting ? 'Submitting…' : 'Submit attempt'}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 p-6">
      <div className="flex items-center justify-between border-b border-neutral-200 pb-3 dark:border-neutral-800">
        <div>
          <div className="text-xs text-neutral-500">{title}</div>
          <div className="font-medium">
            Question {current.order} / {questions.length} · {current.section}
          </div>
        </div>
        <div className={`font-mono text-xl tabular-nums ${timeClass}`}>
          {mm}:{ss}
        </div>
      </div>

      <div className="whitespace-pre-wrap text-lg">{current.stem}</div>

      <div className="flex flex-col gap-2">
        {current.choices.map((c, i) => {
          const selected = currentAnswer.chosenIdx === i;
          return (
            <button
              key={i}
              onClick={() => choose(i)}
              className={`rounded-md border p-3 text-left transition ${
                selected
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                  : 'border-neutral-300 hover:border-neutral-400 dark:border-neutral-700 dark:hover:border-neutral-500'
              }`}
            >
              <span className="mr-2 font-mono text-neutral-500">
                {String.fromCharCode(65 + i)}.
              </span>
              {c}
            </button>
          );
        })}
      </div>

      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-neutral-200 pt-4 dark:border-neutral-800">
        <div className="flex gap-2">
          <button
            onClick={() => setIdx((i) => Math.max(0, i - 1))}
            disabled={idx === 0}
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm disabled:opacity-50 dark:border-neutral-700"
          >
            ← Prev
          </button>
          <button
            onClick={() => setIdx((i) => Math.min(questions.length - 1, i + 1))}
            disabled={idx === questions.length - 1}
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm disabled:opacity-50 dark:border-neutral-700"
          >
            Next →
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={toggleFlag}
            className={`rounded-md border px-3 py-2 text-sm ${
              currentAnswer.flagged
                ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950'
                : 'border-neutral-300 dark:border-neutral-700'
            }`}
          >
            {currentAnswer.flagged ? '⚑ Flagged' : '⚐ Flag'}
          </button>
          <button
            onClick={() => setReviewMode(true)}
            className="rounded-md bg-neutral-900 px-3 py-2 text-sm text-white dark:bg-white dark:text-black"
          >
            Review & submit
          </button>
        </div>
      </div>
    </main>
  );
}
