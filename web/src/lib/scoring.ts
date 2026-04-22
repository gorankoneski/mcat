// MCAT scaled score estimation.
// Each section is scaled 118–132. We use a simple linear mapping from raw
// percent correct, which is a reasonable MVP estimate — real AAMC scales
// are equated per form and not published.

export function estimateScaledScore(correct: number, total: number): number {
  if (total === 0) return 118;
  const pct = correct / total;
  const scaled = Math.round(118 + pct * (132 - 118));
  return Math.max(118, Math.min(132, scaled));
}

export function estimateTotalScore(sections: {
  cp?: { correct: number; total: number };
  cars?: { correct: number; total: number };
  bb?: { correct: number; total: number };
  ps?: { correct: number; total: number };
}) {
  const cp = sections.cp ? estimateScaledScore(sections.cp.correct, sections.cp.total) : null;
  const cars = sections.cars ? estimateScaledScore(sections.cars.correct, sections.cars.total) : null;
  const bb = sections.bb ? estimateScaledScore(sections.bb.correct, sections.bb.total) : null;
  const ps = sections.ps ? estimateScaledScore(sections.ps.correct, sections.ps.total) : null;

  const parts = [cp, cars, bb, ps].filter((x): x is number => x !== null);
  const total = parts.length === 4 ? parts.reduce((a, b) => a + b, 0) : null;

  return { cp, cars, bb, ps, total };
}
