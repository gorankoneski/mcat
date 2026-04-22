import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { estimateScaledScore } from '@/lib/scoring';
import type { Section } from '@prisma/client';

export const runtime = 'nodejs';

export async function POST(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) return new Response('Unauthorized', { status: 401 });
  const { id } = await ctx.params;

  const attempt = await prisma.attempt.findFirst({
    where: { id, userId: session.user.id },
    include: {
      exam: { include: { questions: { include: { question: true } } } },
      answers: true,
    },
  });
  if (!attempt) return new Response('Not found', { status: 404 });
  if (attempt.finishedAt) return Response.json({ alreadyFinished: true, attemptId: attempt.id });

  const answerByQ = new Map(attempt.answers.map((a) => [a.questionId, a]));
  const sectionTotals: Record<Section, { correct: number; total: number }> = {
    CP: { correct: 0, total: 0 },
    CARS: { correct: 0, total: 0 },
    BB: { correct: 0, total: 0 },
    PS: { correct: 0, total: 0 },
  };

  for (const eq of attempt.exam.questions) {
    const ans = answerByQ.get(eq.questionId);
    sectionTotals[eq.section].total += 1;
    if (ans && ans.chosenIdx === eq.question.correctIdx) {
      sectionTotals[eq.section].correct += 1;
    }
  }

  const scaledCP = sectionTotals.CP.total ? estimateScaledScore(sectionTotals.CP.correct, sectionTotals.CP.total) : null;
  const scaledCARS = sectionTotals.CARS.total ? estimateScaledScore(sectionTotals.CARS.correct, sectionTotals.CARS.total) : null;
  const scaledBB = sectionTotals.BB.total ? estimateScaledScore(sectionTotals.BB.correct, sectionTotals.BB.total) : null;
  const scaledPS = sectionTotals.PS.total ? estimateScaledScore(sectionTotals.PS.correct, sectionTotals.PS.total) : null;

  await prisma.attempt.update({
    where: { id },
    data: {
      finishedAt: new Date(),
      scaledCP,
      scaledCARS,
      scaledBB,
      scaledPS,
    },
  });

  return Response.json({ ok: true, attemptId: id });
}
