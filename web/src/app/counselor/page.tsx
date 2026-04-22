import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import AppNav from '@/components/AppNav';

export const dynamic = 'force-dynamic';

export default async function CounselorIndex() {
  const user = await requireUser();

  const conversations = await prisma.aiConversation.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    include: { messages: { orderBy: { createdAt: 'desc' }, take: 1 } },
  });

  async function newConversation() {
    'use server';
    const conv = await prisma.aiConversation.create({ data: { userId: user.id } });
    redirect(`/counselor/${conv.id}`);
  }

  return (
    <>
      <AppNav />
      <main className="mx-auto flex max-w-2xl flex-col gap-6 p-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold">Study Counselor</h1>
            <p className="text-sm text-neutral-500">
              Chat with Claude about your MCAT prep.
            </p>
          </div>
          <form action={newConversation}>
            <button
              type="submit"
              className="rounded-md bg-neutral-900 px-4 py-2 text-sm text-white dark:bg-white dark:text-black"
            >
              New chat
            </button>
          </form>
        </header>

        {conversations.length === 0 ? (
          <p className="text-sm text-neutral-500">No conversations yet.</p>
        ) : (
          <ul className="divide-y divide-neutral-200 rounded-md border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
            {conversations.map((c) => (
              <li key={c.id} className="p-3 text-sm">
                <Link href={`/counselor/${c.id}`} className="flex flex-col gap-1">
                  <span className="font-medium">
                    {c.title ?? `Chat from ${c.createdAt.toLocaleDateString()}`}
                  </span>
                  <span className="truncate text-neutral-500">
                    {c.messages[0]?.content.slice(0, 120) ?? 'No messages yet.'}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
