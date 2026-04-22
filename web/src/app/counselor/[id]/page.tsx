import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import AppNav from '@/components/AppNav';
import CounselorChat from './CounselorChat';

export const dynamic = 'force-dynamic';

export default async function CounselorThreadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;

  const conv = await prisma.aiConversation.findFirst({
    where: { id, userId: user.id },
    include: { messages: { orderBy: { createdAt: 'asc' } } },
  });
  if (!conv) notFound();

  const initialMessages = conv.messages.map((m) => ({
    id: m.id,
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }));

  return (
    <>
      <AppNav />
      <CounselorChat conversationId={conv.id} initialMessages={initialMessages} />
    </>
  );
}
