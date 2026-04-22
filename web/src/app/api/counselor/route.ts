import { NextRequest } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { anthropic, COUNSELOR_MODEL, COUNSELOR_SYSTEM_PROMPT } from '@/lib/anthropic';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const bodySchema = z.object({
  conversationId: z.string().optional(),
  message: z.string().min(1).max(8000),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 });
  }
  const userId = (session.user as { id: string }).id;

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return new Response('Bad request', { status: 400 });
  }
  const { conversationId, message } = parsed.data;

  // Load or create the conversation.
  const conversation = conversationId
    ? await prisma.aiConversation.findFirst({
        where: { id: conversationId, userId },
        include: { messages: { orderBy: { createdAt: 'asc' } } },
      })
    : await prisma.aiConversation.create({
        data: { userId },
        include: { messages: true },
      });

  if (!conversation) {
    return new Response('Conversation not found', { status: 404 });
  }

  // Persist the user turn.
  await prisma.aiMessage.create({
    data: { conversationId: conversation.id, role: 'user', content: message },
  });

  // Build the messages array for Claude from stored history.
  const history = conversation.messages.map((m) => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }));
  history.push({ role: 'user', content: message });

  // Pull study profile for personalization.
  const profile = await prisma.user.findUnique({
    where: { id: userId },
    select: { targetScore: true, testDate: true, hoursPerWeek: true },
  });

  const profileBlock = profile
    ? `Student profile:
- Target score: ${profile.targetScore ?? 'not set'}
- Test date: ${profile.testDate?.toISOString().slice(0, 10) ?? 'not set'}
- Hours/week available: ${profile.hoursPerWeek ?? 'not set'}`
    : 'Student profile: not set';

  const encoder = new TextEncoder();
  let assistantText = '';

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const anthropicStream = anthropic.messages.stream({
          model: COUNSELOR_MODEL,
          max_tokens: 1024,
          system: [
            // Large, stable system prompt — cached to cut cost on repeat calls.
            {
              type: 'text',
              text: COUNSELOR_SYSTEM_PROMPT,
              cache_control: { type: 'ephemeral' },
            },
            { type: 'text', text: profileBlock },
          ],
          messages: history,
        });

        for await (const event of anthropicStream) {
          if (
            event.type === 'content_block_delta' &&
            event.delta.type === 'text_delta'
          ) {
            assistantText += event.delta.text;
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }

        await prisma.aiMessage.create({
          data: {
            conversationId: conversation.id,
            role: 'assistant',
            content: assistantText,
          },
        });

        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Conversation-Id': conversation.id,
      'Cache-Control': 'no-cache, no-transform',
    },
  });
}
