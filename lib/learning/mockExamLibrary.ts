import { isSafeImportedMapKey } from '../storage/importKeySafety';

// Mock exam library — pre-built named mocks matching the official format.
// competitive-teardown.md rec #2 (P0): "Ship a library of pre-built
// full-format mock exams (e.g. Mock 1…N), not only one random generator,
// each matching the official Sverige-i-fokus format/length."
//
// This file holds:
//   - the format constants (question count and time limit)
//   - the metadata for the named mocks (id, label, difficulty, chapter mix)
//   - selectors that materialize a mock from the live question bank
//
// The QUESTION IDs that populate each mock are NOT hardcoded here — they're
// resolved at runtime by sampling the bank with the deterministic seed of
// the mock id, so the mock library survives content updates without code
// changes. A given mock is reproducible: same seed → same question set.

export const MOCK_EXAM_QUESTION_COUNT = 25;
export const MOCK_EXAM_TIME_LIMIT_MINUTES = 30;

export type MockExamDifficulty = 'easy' | 'medium' | 'hard' | 'mixed';

export interface MockExamDescriptor {
  id: string;
  labelSv: string;
  labelEn: string;
  difficulty: MockExamDifficulty;
  /**
   * Soft chapter-mix targets. The materializer aims for these ratios within
   * tolerance; if the bank lacks enough questions for a chapter, the mock
   * still ships and the actual distribution surfaces on the result screen.
   */
  chapterWeights?: Record<string, number>;
  /** Deterministic sampling seed. Must be stable across releases. */
  seed: number;
}

/**
 * Canonical pre-built mocks. Naming matches the user-facing labels; do not
 * rename without a parity-test update.
 *
 * Difficulty progression: 1 (gentle) → 6 (hardest). Mocks 7+ are themed
 * (each emphasizes one knowledge area for users who want targeted practice
 * in exam format).
 */
export const MOCK_EXAM_LIBRARY: readonly MockExamDescriptor[] = [
  {
    id: 'mock-1',
    labelSv: 'Övningsprov 1 – Mjuk start',
    labelEn: 'Mock Exam 1 – Gentle start',
    difficulty: 'easy',
    seed: 1,
  },
  {
    id: 'mock-2',
    labelSv: 'Övningsprov 2 – Standard',
    labelEn: 'Mock Exam 2 – Standard',
    difficulty: 'medium',
    seed: 2,
  },
  {
    id: 'mock-3',
    labelSv: 'Övningsprov 3 – Standard',
    labelEn: 'Mock Exam 3 – Standard',
    difficulty: 'medium',
    seed: 3,
  },
  {
    id: 'mock-4',
    labelSv: 'Övningsprov 4 – Standard plus',
    labelEn: 'Mock Exam 4 – Standard plus',
    difficulty: 'medium',
    seed: 4,
  },
  {
    id: 'mock-5',
    labelSv: 'Övningsprov 5 – Utmaning',
    labelEn: 'Mock Exam 5 – Challenge',
    difficulty: 'hard',
    seed: 5,
  },
  {
    id: 'mock-6',
    labelSv: 'Övningsprov 6 – Slutspurt',
    labelEn: 'Mock Exam 6 – Final stretch',
    difficulty: 'hard',
    seed: 6,
  },
  {
    id: 'mock-random',
    labelSv: 'Slumpmässigt övningsprov',
    labelEn: 'Random mock exam',
    difficulty: 'mixed',
    // Seed of -1 signals: re-roll on each materialization.
    seed: -1,
  },
];

export function getMockExamDescriptor(id: string): MockExamDescriptor | null {
  return MOCK_EXAM_LIBRARY.find((m) => m.id === id) ?? null;
}

// ----- Deterministic sampler ------------------------------------------------
// Mulberry32 PRNG — small, fast, deterministic given a seed.

function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(items: readonly T[], rand: () => number): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function createChapterDistribution(): Record<string, number> {
  return Object.create(null) as Record<string, number>;
}

function normalizeChapterDistributionKey(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const chapterId = value.trim();
  if (!chapterId || !isSafeImportedMapKey(chapterId)) return null;
  return chapterId;
}

export interface MockExamQuestionPick {
  questionId: string;
  /** Difficulty as the bank declared it, kept for the result-screen breakdown. */
  difficulty?: 'easy' | 'medium' | 'hard';
}

export interface MaterializeMockInput {
  mockId: string;
  bank: ReadonlyArray<{
    id: string;
    difficulty?: 'easy' | 'medium' | 'hard';
    chapterId?: string;
  }>;
  /** Overrides the seed (used by 'mock-random' to roll fresh each time). */
  seedOverride?: number;
}

export interface MaterializedMock {
  descriptor: MockExamDescriptor;
  questions: MockExamQuestionPick[];
  /** Distribution sampled; lets the exam screen show "ch X: 3 questions". */
  chapterDistribution: Record<string, number>;
  /** True when the bank didn't have enough questions to fill the format. */
  isUnderfilled: boolean;
}

/**
 * Materialize a mock from a descriptor + live question bank. Deterministic
 * given (mockId, bank ordering) unless the mock has seed=-1 (random).
 *
 * Sampling strategy:
 *   1. Filter the bank by the descriptor's difficulty (when not 'mixed').
 *   2. Shuffle with the descriptor's seed.
 *   3. Take the first MOCK_EXAM_QUESTION_COUNT.
 *   4. If filtering yielded fewer than the count, top up from the wider bank
 *      (still shuffled with the same seed) so the user always gets a full mock.
 */
export function materializeMock(input: MaterializeMockInput): MaterializedMock | null {
  const descriptor = getMockExamDescriptor(input.mockId);
  if (!descriptor) return null;

  const seed =
    input.seedOverride ??
    (descriptor.seed === -1 ? Math.floor(Math.random() * 0xffffffff) : descriptor.seed);
  const rand = mulberry32(seed);

  const filtered =
    descriptor.difficulty === 'mixed'
      ? input.bank.slice()
      : input.bank.filter((q) => q.difficulty === descriptor.difficulty);
  const filteredShuffled = shuffle(filtered, rand);

  let picked = filteredShuffled.slice(0, MOCK_EXAM_QUESTION_COUNT);

  if (picked.length < MOCK_EXAM_QUESTION_COUNT) {
    const pickedIds = new Set(picked.map((q) => q.id));
    const topUp = shuffle(input.bank, rand).filter((q) => !pickedIds.has(q.id));
    picked = picked.concat(topUp).slice(0, MOCK_EXAM_QUESTION_COUNT);
  }

  const chapterDistribution = createChapterDistribution();
  for (const q of picked) {
    const chapterId = normalizeChapterDistributionKey(q.chapterId);
    if (!chapterId) continue;
    chapterDistribution[chapterId] = (chapterDistribution[chapterId] ?? 0) + 1;
  }

  return {
    descriptor,
    questions: picked.map((q) => ({ questionId: q.id, difficulty: q.difficulty })),
    chapterDistribution,
    isUnderfilled: picked.length < MOCK_EXAM_QUESTION_COUNT,
  };
}
