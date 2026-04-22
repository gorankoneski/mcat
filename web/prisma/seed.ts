// Seed AAMC MCAT content taxonomy, sample lessons, questions, and a demo exam.
// Idempotent — can be re-run safely.

import { PrismaClient, Section, ExamType } from '@prisma/client';

const prisma = new PrismaClient();

type CategorySeed = {
  section: Section;
  code: string;
  name: string;
};

// Official AAMC content categories (abbreviated names).
const CATEGORIES: CategorySeed[] = [
  // Chemical & Physical Foundations
  { section: 'CP', code: '4A', name: 'Translational motion, forces, work, energy' },
  { section: 'CP', code: '4B', name: 'Fluids in circulation and gas exchange' },
  { section: 'CP', code: '4C', name: 'Electrochemistry and electrical circuits' },
  { section: 'CP', code: '4D', name: 'How light and sound interact with matter' },
  { section: 'CP', code: '4E', name: 'Atoms, nuclear decay, electronic structure' },
  { section: 'CP', code: '5A', name: 'Unique nature of water and its solutions' },
  { section: 'CP', code: '5B', name: 'Molecules and intermolecular interactions' },
  { section: 'CP', code: '5C', name: 'Separation and purification methods' },
  { section: 'CP', code: '5D', name: 'Biologically-relevant molecules' },
  { section: 'CP', code: '5E', name: 'Thermodynamics and kinetics' },

  // Biological & Biochemical Foundations
  { section: 'BB', code: '1A', name: 'Structure and function of proteins' },
  { section: 'BB', code: '1B', name: 'Gene expression (DNA → RNA → protein)' },
  { section: 'BB', code: '1C', name: 'Inheritance and genetic variation' },
  { section: 'BB', code: '1D', name: 'Bioenergetics and fuel metabolism' },
  { section: 'BB', code: '2A', name: 'Molecules, cells, and tissues' },
  { section: 'BB', code: '2B', name: 'Prokaryotes and viruses' },
  { section: 'BB', code: '2C', name: 'Cell division and differentiation' },
  { section: 'BB', code: '3A', name: 'Nervous and endocrine systems' },
  { section: 'BB', code: '3B', name: 'Main organ systems' },

  // Psychological, Social & Biological Foundations of Behavior
  { section: 'PS', code: '6A', name: 'Sensing the environment' },
  { section: 'PS', code: '6B', name: 'Making sense of the environment' },
  { section: 'PS', code: '6C', name: 'Responding to the world' },
  { section: 'PS', code: '7A', name: 'Individual influences on behavior' },
  { section: 'PS', code: '7B', name: 'Social processes' },
  { section: 'PS', code: '7C', name: 'Attitude and behavior change' },
  { section: 'PS', code: '8A', name: 'Self-identity' },
  { section: 'PS', code: '8B', name: 'Social thinking' },
  { section: 'PS', code: '8C', name: 'Social interactions' },
  { section: 'PS', code: '9A', name: 'Understanding social structure' },
  { section: 'PS', code: '9B', name: 'Demographic processes' },
  { section: 'PS', code: '10A', name: 'Social inequality' },

  // CARS has no content categories — one bucket so questions still attach.
  { section: 'CARS', code: 'CARS', name: 'Critical analysis and reasoning' },
];

async function upsertCategories() {
  for (const c of CATEGORIES) {
    await prisma.contentCategory.upsert({
      where: { code: c.code },
      update: { name: c.name, section: c.section },
      create: c,
    });
  }
}

type TopicSeed = {
  slug: string;
  name: string;
  categoryCode: string;
  summary: string;
  lesson: { title: string; bodyMdx: string };
  questions: Array<{
    stem: string;
    choices: string[];
    correctIdx: number;
    explanation: string;
    difficulty: number;
  }>;
};

const TOPICS: TopicSeed[] = [
  {
    slug: 'kinematics-1d',
    name: 'One-dimensional kinematics',
    categoryCode: '4A',
    summary: 'Position, velocity, acceleration, and the big four equations.',
    lesson: {
      title: 'One-dimensional kinematics',
      bodyMdx: `# One-dimensional kinematics

Motion along a straight line is described by four constant-acceleration equations:

$$v = v_0 + at$$

$$x = x_0 + v_0 t + \\tfrac{1}{2} a t^2$$

$$v^2 = v_0^2 + 2 a (x - x_0)$$

$$\\bar{v} = \\tfrac{1}{2}(v_0 + v)$$

## High-yield MCAT traps

- **Free fall**: \`a = -g ≈ -9.8 m/s²\` when up is positive.
- At the apex of a projectile, $v_y = 0$ but $a_y = -g$ (not zero).
- Average velocity equals $\\tfrac{1}{2}(v_0 + v)$ **only** when acceleration is constant.

## Quick check

A ball is dropped from rest from 20 m. Using $v^2 = 2gh$, $v = \\sqrt{2 \\cdot 9.8 \\cdot 20} \\approx 19.8$ m/s.
`,
    },
    questions: [
      {
        stem: 'A ball is thrown straight up with an initial velocity of 20 m/s. How high does it rise? (Use g = 10 m/s² for simplicity.)',
        choices: ['10 m', '15 m', '20 m', '40 m'],
        correctIdx: 2,
        explanation: 'At max height v = 0, so v² = v₀² − 2gh ⇒ h = v₀²/(2g) = 400/20 = 20 m.',
        difficulty: 2,
      },
      {
        stem: 'Which quantity is zero at the apex of a projectile in 1-D vertical motion?',
        choices: ['Velocity', 'Acceleration', 'Both velocity and acceleration', 'Neither'],
        correctIdx: 0,
        explanation: 'Vertical velocity is zero at the apex; gravitational acceleration still acts (−g).',
        difficulty: 1,
      },
      {
        stem: 'A car accelerates uniformly from rest to 30 m/s in 10 s. What distance does it cover?',
        choices: ['75 m', '150 m', '300 m', '450 m'],
        correctIdx: 1,
        explanation: 'Average velocity = ½(0 + 30) = 15 m/s; distance = 15 × 10 = 150 m.',
        difficulty: 2,
      },
      {
        stem: 'Average velocity equals ½(v₀ + v) under which condition?',
        choices: ['Always', 'Only at rest', 'Only with constant acceleration', 'Only for circular motion'],
        correctIdx: 2,
        explanation: 'The arithmetic mean of velocities equals average velocity only when acceleration is constant.',
        difficulty: 2,
      },
      {
        stem: 'An object is dropped from 45 m. How long until it hits the ground? (g = 10 m/s²)',
        choices: ['2 s', '3 s', '4.5 s', '9 s'],
        correctIdx: 1,
        explanation: 'h = ½gt² ⇒ t = √(2h/g) = √(90/10) = 3 s.',
        difficulty: 2,
      },
    ],
  },
  {
    slug: 'amino-acids',
    name: 'Amino acids and protein structure',
    categoryCode: '1A',
    summary: 'The 20 amino acids, side-chain chemistry, and the four levels of protein structure.',
    lesson: {
      title: 'Amino acids and protein structure',
      bodyMdx: `# Amino acids and protein structure

All 20 proteinogenic amino acids share the same core — an $\\alpha$-carbon bonded to an amino group, a carboxyl group, a hydrogen, and a side chain (R).

## Side-chain categories (know these cold)

- **Nonpolar / hydrophobic**: Gly, Ala, Val, Leu, Ile, Pro, Met, Phe, Trp
- **Polar uncharged**: Ser, Thr, Cys, Asn, Gln, Tyr
- **Acidic (−)**: Asp, Glu
- **Basic (+)**: Lys, Arg, His

## Four levels of structure

1. **Primary** — sequence of amino acids, held by peptide bonds.
2. **Secondary** — local folds ($\\alpha$-helix, $\\beta$-sheet) held by backbone H-bonds.
3. **Tertiary** — 3-D fold stabilized by R-group interactions: hydrophobic core, disulfide bridges (Cys–Cys), H-bonds, salt bridges.
4. **Quaternary** — assembly of multiple subunits (e.g., hemoglobin is $\\alpha_2\\beta_2$).

> Denaturation disrupts non-covalent interactions but typically preserves the primary sequence.
`,
    },
    questions: [
      {
        stem: 'Which amino acid pair can form a disulfide bridge?',
        choices: ['Ser–Ser', 'Cys–Cys', 'Asp–Glu', 'Lys–Arg'],
        correctIdx: 1,
        explanation: 'Disulfide bridges form between the thiol side chains of two cysteine residues.',
        difficulty: 1,
      },
      {
        stem: 'An α-helix is stabilized primarily by:',
        choices: [
          'Ionic bonds between side chains',
          'Backbone hydrogen bonds',
          'Disulfide bridges',
          'Peptide bonds',
        ],
        correctIdx: 1,
        explanation: 'The α-helix is held by H-bonds between backbone C=O (residue i) and N–H (residue i+4).',
        difficulty: 2,
      },
      {
        stem: 'Which level of protein structure is NOT typically disrupted by denaturation?',
        choices: ['Primary', 'Secondary', 'Tertiary', 'Quaternary'],
        correctIdx: 0,
        explanation: 'Primary structure is covalent (peptide bonds) and survives most denaturants.',
        difficulty: 1,
      },
      {
        stem: 'Hemoglobin is best described as having what structural feature?',
        choices: ['Only primary structure', 'Only secondary structure', 'Quaternary structure (α₂β₂)', 'No tertiary structure'],
        correctIdx: 2,
        explanation: 'Hemoglobin is a tetramer of two α and two β subunits — classic quaternary structure.',
        difficulty: 1,
      },
      {
        stem: 'Which amino acid is positively charged at physiological pH?',
        choices: ['Aspartate', 'Lysine', 'Serine', 'Phenylalanine'],
        correctIdx: 1,
        explanation: 'Lysine’s ε-amino group has a pKa near 10.5, so it is protonated (+) at pH 7.4.',
        difficulty: 1,
      },
    ],
  },
  {
    slug: 'cars-argument-structure',
    name: 'CARS — argument structure and passage mapping',
    categoryCode: 'CARS',
    summary: 'How to map claim, evidence, and counterclaim inside a CARS passage.',
    lesson: {
      title: 'CARS — reading for argument structure',
      bodyMdx: `# Reading for argument structure

CARS is not a content test. Every passage is an argument. Your job is to map:

1. **Main claim** — the one sentence the author would defend above all others.
2. **Support** — the evidence, examples, and definitions that prop it up.
3. **Counterclaim** — any view the author names only to push back against.
4. **Tone** — neutral, critical, conciliatory, advocating?

## Passage-mapping technique

- After each paragraph, jot **one phrase** summarizing its role in the argument.
- Notice **pivot words**: *however, yet, although, in contrast, nevertheless*. The sentence after a pivot usually carries weight.
- Track the **author's voice** vs **reported views**. A view introduced with *"Many argue that…"* is almost never the author's.

## Answer-choice pitfalls

- **Too strong** — absolutes like *always, never, only* rarely match careful prose.
- **Out of scope** — answer is true in the world but the passage did not claim it.
- **Reverse** — answer reverses cause and effect or claim and counterclaim.
`,
    },
    questions: [
      {
        stem: 'Which phrase most often signals that the next sentence carries the author’s own view?',
        choices: ['"For example,"', '"However,"', '"As is well known,"', '"Historically,"'],
        correctIdx: 1,
        explanation: 'Pivot words like *however* mark a turn where the author typically asserts their position.',
        difficulty: 2,
      },
      {
        stem: 'An answer choice that uses the word "always" in a passage-based question is usually:',
        choices: [
          'Correct, because it is comprehensive',
          'Suspicious, because absolutes rarely match careful academic prose',
          'Irrelevant to the question stem',
          'Correct only in science passages',
        ],
        correctIdx: 1,
        explanation: 'Absolutes almost never survive close reading of a hedged humanities argument.',
        difficulty: 2,
      },
      {
        stem: 'The phrase "Many critics argue that X, but…" is most likely introducing:',
        choices: [
          'The author’s main claim',
          'A counterclaim the author will dispute',
          'A definition',
          'A piece of supporting evidence',
        ],
        correctIdx: 1,
        explanation: '"Many argue that… but" is the classic setup for a counterclaim about to be refuted.',
        difficulty: 1,
      },
      {
        stem: 'The best strategy after reading each CARS paragraph is to:',
        choices: [
          'Memorize three details',
          'Write one phrase describing the paragraph’s role in the argument',
          'Re-read it',
          'Skip it and return later',
        ],
        correctIdx: 1,
        explanation: 'A one-phrase role tag is the fastest way to hold passage structure in working memory.',
        difficulty: 1,
      },
      {
        stem: 'An "out of scope" wrong answer is one that:',
        choices: [
          'Is factually false',
          'Contradicts the passage',
          'May be true in general but was not claimed by the passage',
          'Uses an absolute word',
        ],
        correctIdx: 2,
        explanation: 'Out-of-scope answers slide past the passage by invoking outside knowledge.',
        difficulty: 2,
      },
    ],
  },
  {
    slug: 'operant-conditioning',
    name: 'Operant conditioning',
    categoryCode: '7A',
    summary: 'Reinforcement, punishment, and schedules in Skinnerian learning.',
    lesson: {
      title: 'Operant conditioning',
      bodyMdx: `# Operant conditioning

Operant conditioning (B.F. Skinner) shapes voluntary behavior via consequences.

## The 2 × 2 matrix

|              | Add (+)              | Remove (−)            |
|--------------|----------------------|-----------------------|
| **Reinforce (↑ behavior)** | Positive reinforcement | Negative reinforcement |
| **Punish (↓ behavior)**    | Positive punishment    | Negative punishment    |

Mnemonic: *positive* = add; *negative* = subtract. The valence does **not** mean "good" or "bad."

## Schedules of reinforcement

- **Fixed ratio** — after every *n* responses. High, steady rate with a post-reinforcement pause.
- **Variable ratio** — after an unpredictable number (slot machines). Most resistant to extinction.
- **Fixed interval** — after a set time window. Scalloped response pattern.
- **Variable interval** — after an unpredictable time. Steady, moderate rate.

> Variable-ratio schedules produce the highest and most persistent response rates.
`,
    },
    questions: [
      {
        stem: 'Removing an aversive stimulus to increase behavior is called:',
        choices: ['Positive reinforcement', 'Negative reinforcement', 'Positive punishment', 'Negative punishment'],
        correctIdx: 1,
        explanation: 'Negative = subtract; reinforcement = increases behavior. Removing the aversive stimulus = negative reinforcement.',
        difficulty: 1,
      },
      {
        stem: 'Which schedule of reinforcement is most resistant to extinction?',
        choices: ['Fixed ratio', 'Variable ratio', 'Fixed interval', 'Variable interval'],
        correctIdx: 1,
        explanation: 'Variable-ratio (slot machines) is the most extinction-resistant because reinforcement is unpredictable.',
        difficulty: 2,
      },
      {
        stem: 'A parent takes away a child’s phone for talking back, which reduces the behavior. This is:',
        choices: ['Positive reinforcement', 'Negative reinforcement', 'Positive punishment', 'Negative punishment'],
        correctIdx: 3,
        explanation: 'Removing something desirable (−) to decrease behavior (punishment) = negative punishment.',
        difficulty: 1,
      },
      {
        stem: 'A "scalloped" response pattern — slow after reinforcement, faster near the next expected delivery — is characteristic of:',
        choices: ['Fixed ratio', 'Variable ratio', 'Fixed interval', 'Continuous'],
        correctIdx: 2,
        explanation: 'Fixed-interval schedules produce the classic scallop because the organism learns the time contingency.',
        difficulty: 2,
      },
      {
        stem: 'Shaping refers to:',
        choices: [
          'Rewarding only perfect behavior',
          'Reinforcing successive approximations toward a target behavior',
          'Punishing unwanted behavior',
          'Ignoring the organism until it performs the behavior',
        ],
        correctIdx: 1,
        explanation: 'Shaping reinforces progressively closer approximations to the desired behavior.',
        difficulty: 1,
      },
    ],
  },
];

async function upsertTopicsAndContent() {
  for (const t of TOPICS) {
    const cat = await prisma.contentCategory.findUnique({ where: { code: t.categoryCode } });
    if (!cat) continue;

    const topic = await prisma.topic.upsert({
      where: { slug: t.slug },
      update: { name: t.name, summary: t.summary, contentCategoryId: cat.id },
      create: { slug: t.slug, name: t.name, summary: t.summary, contentCategoryId: cat.id },
    });

    await prisma.lesson.upsert({
      where: { slug: `${t.slug}-lesson` },
      update: { title: t.lesson.title, bodyMdx: t.lesson.bodyMdx, topicId: topic.id },
      create: {
        slug: `${t.slug}-lesson`,
        title: t.lesson.title,
        bodyMdx: t.lesson.bodyMdx,
        topicId: topic.id,
      },
    });

    // Only seed questions for this topic if it has none yet.
    const existingCount = await prisma.question.count({ where: { topicId: topic.id } });
    if (existingCount === 0) {
      for (const q of t.questions) {
        await prisma.question.create({
          data: {
            topicId: topic.id,
            section: cat.section,
            stem: q.stem,
            choices: q.choices,
            correctIdx: q.correctIdx,
            explanation: q.explanation,
            difficulty: q.difficulty,
          },
        });
      }
    }
  }
}

async function seedDemoExam() {
  const existing = await prisma.exam.findFirst({ where: { title: 'Demo mini-exam' } });
  if (existing) return;

  const questions = await prisma.question.findMany({ take: 20, orderBy: { createdAt: 'asc' } });
  if (questions.length === 0) return;

  const exam = await prisma.exam.create({
    data: {
      type: ExamType.DRILL,
      title: 'Demo mini-exam',
    },
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
}

async function main() {
  console.log('Seeding AAMC content categories…');
  await upsertCategories();

  console.log('Seeding sample topics, lessons, and questions…');
  await upsertTopicsAndContent();

  console.log('Seeding demo exam…');
  await seedDemoExam();

  console.log('✓ seed complete');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
