import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import AppNav from '@/components/AppNav';
import { ExamType, Section } from '@prisma/client';

export const dynamic = 'force-dynamic';

export default async function AdminExamsPage() {
  await requireAdmin();

  const exams = await prisma.exam.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { questions: true } } },
  });

  async function createExam(formData: FormData) {
    'use server';
    await requireAdmin();
    const title = String(formData.get('title') ?? '').trim();
    const type = String(formData.get('type') ?? '') as ExamType;
    const section = String(formData.get('section') ?? '') as Section | '';
    const limit = Number(formData.get('limit') ?? 20);
    if (!title) return;

    const exam = await prisma.exam.create({
      data: {
        title,
        type,
        section: section ? (section as Section) : null,
      },
    });

    const questions = await prisma.question.findMany({
      where: section ? { section: section as Section } : {},
      take: limit,
      orderBy: { createdAt: 'asc' },
    });
    for (let i = 0; i < questions.length; i++) {
      await prisma.examQuestion.create({
        data: {
          examId: exam.id,
          questionId: questions[i].id,
          section: questions[i].section,
          order: i + 1,
        },
      });
    }
    revalidatePath('/admin/exams');
    revalidatePath('/exams');
  }

  return (
    <>
      <AppNav />
      <main className="mx-auto flex max-w-3xl flex-col gap-6 p-6">
        <h1 className="text-3xl font-semibold">Exams</h1>

        <form
          action={createExam}
          className="flex flex-col gap-3 rounded-md border border-neutral-200 p-4 dark:border-neutral-800"
        >
          <div className="font-medium">Create exam from question bank</div>
          <input
            name="title"
            required
            placeholder="Title"
            className="rounded-md border border-neutral-300 bg-white px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900"
          />
          <select
            name="type"
            className="rounded-md border border-neutral-300 bg-white px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900"
          >
            <option value="DRILL">Drill</option>
            <option value="SECTION">Section</option>
            <option value="FULL_LENGTH">Full length</option>
          </select>
          <select
            name="section"
            className="rounded-md border border-neutral-300 bg-white px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900"
          >
            <option value="">All sections</option>
            <option value="CP">Chem/Phys</option>
            <option value="CARS">CARS</option>
            <option value="BB">Bio/Biochem</option>
            <option value="PS">Psych/Soc</option>
          </select>
          <label className="text-sm">Question count</label>
          <input
            name="limit"
            type="number"
            min={1}
            max={230}
            defaultValue={20}
            className="rounded-md border border-neutral-300 bg-white px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900"
          />
          <button className="self-start rounded-md bg-neutral-900 px-4 py-2 text-sm text-white dark:bg-white dark:text-black">
            Create
          </button>
        </form>

        <ul className="divide-y divide-neutral-200 rounded-md border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
          {exams.map((e) => (
            <li key={e.id} className="flex items-center justify-between p-3 text-sm">
              <div>
                <div className="font-medium">{e.title}</div>
                <div className="text-xs text-neutral-500">
                  {e.type} · {e._count.questions} questions · {e.section ?? 'all'}
                </div>
              </div>
              <span className="text-xs text-neutral-500">
                {e.createdAt.toLocaleDateString()}
              </span>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}
