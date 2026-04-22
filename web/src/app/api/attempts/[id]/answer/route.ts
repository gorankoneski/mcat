import { NextRequest } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

const bodySchema = z.object({
  questionId: z.string(),
  chosenIdx: z.number().int().min(0).max(10).nullable(),
  flagged: z.boolean().optional(),
  timeMs: z.number().int().nonnegative().optional(),
});

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) return new Response('Unauthorized', { status: 401 });
  const { id } = await ctx.params;

  const attempt = await prisma.attempt.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!attempt) return new Response('Not found', { status: 404 });
  if (attempt.finishedAt) return new Response('Attempt already finished', { status: 409 });

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) return new Response('Bad request', { status: 400 });

  const { questionId, chosenIdx, flagged, timeMs } = parsed.data;

  await prisma.attemptAnswer.upsert({
    where: { attemptId_questionId: { attemptId: id, questionId } },
    update: { chosenIdx, flagged: flagged ?? false, timeMs },
    create: {
      attemptId: id,
      questionId,
      chosenIdx,
      flagged: flagged ?? false,
      timeMs,
    },
  });

  return Response.json({ ok: true });
}
