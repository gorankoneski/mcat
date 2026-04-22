import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import AppNav from '@/components/AppNav';

export const dynamic = 'force-dynamic';

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default async function NewLessonPage() {
  await requireAdmin();

  const categories = await prisma.contentCategory.findMany({
    orderBy: [{ section: 'asc' }, { code: 'asc' }],
  });
  const topics = await prisma.topic.findMany({
    orderBy: { name: 'asc' },
    include: { contentCategory: true },
  });

  async function createLesson(formData: FormData) {
    'use server';
    await requireAdmin();
    const title = String(formData.get('title') ?? '').trim();
    const bodyMdx = String(formData.get('bodyMdx') ?? '');
    const topicId = String(formData.get('topicId') ?? '');
    const newTopicName = String(formData.get('newTopicName') ?? '').trim();
    const newTopicCategory = String(formData.get('newTopicCategory') ?? '');

    if (!title || !bodyMdx) return;

    let resolvedTopicId = topicId;
    if (!resolvedTopicId && newTopicName && newTopicCategory) {
      const topic = await prisma.topic.create({
        data: {
          name: newTopicName,
          slug: slugify(newTopicName),
          contentCategoryId: newTopicCategory,
        },
      });
      resolvedTopicId = topic.id;
    }
    if (!resolvedTopicId) return;

    const lesson = await prisma.lesson.create({
      data: {
        title,
        slug: slugify(title),
        bodyMdx,
        topicId: resolvedTopicId,
      },
    });
    redirect(`/lessons/${lesson.slug}`);
  }

  return (
    <>
      <AppNav />
      <main className="mx-auto flex max-w-2xl flex-col gap-4 p-6">
        <h1 className="text-3xl font-semibold">New lesson</h1>

        <form action={createLesson} className="flex flex-col gap-3">
          <label className="text-sm font-medium">Title</label>
          <input
            name="title"
            required
            className="rounded-md border border-neutral-300 bg-white px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900"
          />

          <label className="text-sm font-medium">Existing topic</label>
          <select
            name="topicId"
            className="rounded-md border border-neutral-300 bg-white px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900"
          >
            <option value="">— create new topic below —</option>
            {topics.map((t) => (
              <option key={t.id} value={t.id}>
                {t.contentCategory.section} · {t.contentCategory.code} · {t.name}
              </option>
            ))}
          </select>

          <details className="rounded-md border border-neutral-200 p-3 dark:border-neutral-800">
            <summary className="cursor-pointer text-sm font-medium">
              Or create a new topic
            </summary>
            <div className="mt-3 flex flex-col gap-2">
              <label className="text-sm">New topic name</label>
              <input
                name="newTopicName"
                className="rounded-md border border-neutral-300 bg-white px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900"
              />
              <label className="text-sm">Content category</label>
              <select
                name="newTopicCategory"
                className="rounded-md border border-neutral-300 bg-white px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900"
              >
                <option value="">— pick one —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.section} · {c.code} · {c.name}
                  </option>
                ))}
              </select>
            </div>
          </details>

          <label className="text-sm font-medium">Body (Markdown + KaTeX math)</label>
          <textarea
            name="bodyMdx"
            required
            rows={20}
            placeholder="# Title\n\nWrite markdown. Inline math: $E=mc^2$. Display math: $$\\int_0^1 x\\,dx$$"
            className="rounded-md border border-neutral-300 bg-white px-3 py-2 font-mono text-sm dark:border-neutral-700 dark:bg-neutral-900"
          />

          <button className="self-start rounded-md bg-neutral-900 px-4 py-2 text-white dark:bg-white dark:text-black">
            Create
          </button>
        </form>
      </main>
    </>
  );
}
