import Link from 'next/link';
import { requireUser } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import AppNav from '@/components/AppNav';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const user = await requireUser();

  const [attempts, conversations, dueReviews] = await Promise.all([
    prisma.attempt.findMany({
      where: { userId: user.id },
      orderBy: { startedAt: 'desc' },
      take: 5,
      include: { exam: true },
    }),
    prisma.aiConversation.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.flashcardReview.count({
      where: { userId: user.id, dueAt: { lte: new Date() } },
    }),
  ]);

  return (
    <>
      <AppNav />
      <main className="mx-auto flex max-w-4xl flex-col gap-8 p-6">
        <header>
          <h1 className="text-3xl font-semibold">Today</h1>
          <p className="text-sm text-neutral-500">
            Welcome back{user.name ? `, ${user.name}` : ''}.
          </p>
        </header>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card href="/lessons" title="Lessons" body="Study by section" />
          <Card href="/exams" title="Exams" body="Full-length + section sims" />
          <Card
            href="/counselor"
            title="Ask Counselor"
            body="Chat with Claude about your prep"
          />
        </section>

        <section>
          <h2 className="mb-3 text-lg font-medium">Recent attempts</h2>
          {attempts.length === 0 ? (
            <p className="text-sm text-neutral-500">No attempts yet.</p>
          ) : (
            <ul className="divide-y divide-neutral-200 rounded-md border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
              {attempts.map((a) => (
                <li key={a.id} className="flex items-center justify-between p-3 text-sm">
                  <span>{a.exam.title}</span>
                  <span className="text-neutral-500">
                    {a.finishedAt ? 'Completed' : 'In progress'} ·{' '}
                    {a.startedAt.toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-md border border-neutral-200 p-4 dark:border-neutral-800">
            <div className="text-sm text-neutral-500">Flashcards due</div>
            <div className="text-2xl font-semibold">{dueReviews}</div>
          </div>
          <div className="rounded-md border border-neutral-200 p-4 dark:border-neutral-800">
            <div className="text-sm text-neutral-500">Counselor threads</div>
            <div className="text-2xl font-semibold">{conversations.length}</div>
          </div>
        </section>
      </main>
    </>
  );
}

function Card({ href, title, body }: { href: string; title: string; body: string }) {
  return (
    <Link
      href={href}
      className="block rounded-md border border-neutral-200 p-4 transition hover:border-neutral-400 dark:border-neutral-800 dark:hover:border-neutral-600"
    >
      <div className="font-medium">{title}</div>
      <div className="text-sm text-neutral-500">{body}</div>
    </Link>
  );
}
