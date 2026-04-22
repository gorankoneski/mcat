import Link from 'next/link';
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

export default async function LessonsPage() {
  await requireUser();

  const categories = await prisma.contentCategory.findMany({
    orderBy: [{ section: 'asc' }, { code: 'asc' }],
    include: {
      topics: {
        orderBy: { name: 'asc' },
        include: { lessons: { select: { slug: true, title: true } } },
      },
    },
  });

  const bySection = new Map<Section, typeof categories>();
  for (const c of categories) {
    if (!bySection.has(c.section)) bySection.set(c.section, []);
    bySection.get(c.section)!.push(c);
  }

  return (
    <>
      <AppNav />
      <main className="mx-auto flex max-w-4xl flex-col gap-8 p-6">
        <header>
          <h1 className="text-3xl font-semibold">Lessons</h1>
          <p className="text-sm text-neutral-500">Browse by AAMC section and content category.</p>
        </header>

        {(['CP', 'CARS', 'BB', 'PS'] as Section[]).map((section) => {
          const cats = bySection.get(section) ?? [];
          return (
            <section key={section}>
              <h2 className="mb-3 text-xl font-medium">{SECTION_LABEL[section]}</h2>
              {cats.length === 0 && <p className="text-sm text-neutral-500">No content yet.</p>}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {cats.map((c) => (
                  <div
                    key={c.id}
                    className="rounded-md border border-neutral-200 p-4 dark:border-neutral-800"
                  >
                    <div className="mb-2 text-xs font-mono text-neutral-500">{c.code}</div>
                    <div className="mb-3 font-medium">{c.name}</div>
                    {c.topics.length === 0 ? (
                      <div className="text-xs text-neutral-500">No topics yet.</div>
                    ) : (
                      <ul className="space-y-1 text-sm">
                        {c.topics.flatMap((t) =>
                          t.lessons.map((l) => (
                            <li key={l.slug}>
                              <Link
                                href={`/lessons/${l.slug}`}
                                className="text-blue-600 hover:underline"
                              >
                                {l.title}
                              </Link>
                            </li>
                          )),
                        )}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </main>
    </>
  );
}
