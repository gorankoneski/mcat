import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import AppNav from '@/components/AppNav';
import { Section } from '@prisma/client';

export const dynamic = 'force-dynamic';

export default async function NewQuestionPage() {
  await requireAdmin();
  const topics = await prisma.topic.findMany({
    orderBy: { name: 'asc' },
    include: { contentCategory: true },
  });

  async function createQuestion(formData: FormData) {
    'use server';
    await requireAdmin();
    const topicId = String(formData.get('topicId') ?? '');
    const section = String(formData.get('section') ?? '') as Section;
    const stem = String(formData.get('stem') ?? '').trim();
    const correctIdx = Number(formData.get('correctIdx') ?? 0);
    const difficulty = Number(formData.get('difficulty') ?? 3);
    const explanation = String(formData.get('explanation') ?? '').trim();
    const choices = [
      String(formData.get('choice0') ?? '').trim(),
      String(formData.get('choice1') ?? '').trim(),
      String(formData.get('choice2') ?? '').trim(),
      String(formData.get('choice3') ?? '').trim(),
    ].filter(Boolean);

    if (!stem || choices.length < 2) return;

    await prisma.question.create({
      data: {
        topicId: topicId || null,
        section,
        stem,
        choices,
        correctIdx,
        difficulty,
        explanation: explanation || null,
      },
    });
    redirect('/admin/questions');
  }

  return (
    <>
      <AppNav />
      <main className="mx-auto flex max-w-2xl flex-col gap-4 p-6">
        <h1 className="text-3xl font-semibold">New question</h1>

        <form action={createQuestion} className="flex flex-col gap-3">
          <label className="text-sm font-medium">Section</label>
          <select
            name="section"
            required
            className="rounded-md border border-neutral-300 bg-white px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900"
          >
            <option value="CP">Chem/Phys</option>
            <option value="CARS">CARS</option>
            <option value="BB">Bio/Biochem</option>
            <option value="PS">Psych/Soc</option>
          </select>

          <label className="text-sm font-medium">Topic (optional)</label>
          <select
            name="topicId"
            className="rounded-md border border-neutral-300 bg-white px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900"
          >
            <option value="">—</option>
            {topics.map((t) => (
              <option key={t.id} value={t.id}>
                {t.contentCategory.code} · {t.name}
              </option>
            ))}
          </select>

          <label className="text-sm font-medium">Question stem</label>
          <textarea
            name="stem"
            required
            rows={4}
            className="rounded-md border border-neutral-300 bg-white px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900"
          />

          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="w-6 font-mono text-sm">{String.fromCharCode(65 + i)}.</span>
              <input
                name={`choice${i}`}
                placeholder={`Choice ${String.fromCharCode(65 + i)}`}
                className="flex-1 rounded-md border border-neutral-300 bg-white px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900"
              />
            </div>
          ))}

          <label className="text-sm font-medium">Correct answer index</label>
          <select
            name="correctIdx"
            className="rounded-md border border-neutral-300 bg-white px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900"
          >
            <option value="0">A</option>
            <option value="1">B</option>
            <option value="2">C</option>
            <option value="3">D</option>
          </select>

          <label className="text-sm font-medium">Difficulty (1–5)</label>
          <input
            name="difficulty"
            type="number"
            min={1}
            max={5}
            defaultValue={3}
            className="rounded-md border border-neutral-300 bg-white px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900"
          />

          <label className="text-sm font-medium">Explanation</label>
          <textarea
            name="explanation"
            rows={3}
            className="rounded-md border border-neutral-300 bg-white px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900"
          />

          <button className="self-start rounded-md bg-neutral-900 px-4 py-2 text-white dark:bg-white dark:text-black">
            Create
          </button>
        </form>
      </main>
    </>
  );
}
