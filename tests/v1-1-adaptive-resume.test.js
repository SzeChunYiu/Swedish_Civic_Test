// Tests for v1.1 adaptive practice + resume selectors (PR8).
// Run with: node --test tests/v1-1-adaptive-resume.test.js

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');
const {
  createMalformedAdaptiveDifficultyCases,
} = require('./helpers/adaptivePracticeRuntimeFixtures.cjs');

const repoRoot = path.resolve(__dirname, '..');

require.extensions['.ts'] = function tsLoader(module, filename) {
  const source = fs.readFileSync(filename, 'utf8');
  const transpiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: filename,
  }).outputText;
  module._compile(transpiled, filename);
};

function loadTs(rel) {
  return require(path.join(repoRoot, rel));
}

function progressFromAnswers(answers) {
  return {
    totalXp: 0,
    level: 1,
    currentStreak: 0,
    dailyGoalAnswers: 10,
    questionProgress: {},
    sessions: [
      { id: 's1', mode: 'study', questionIds: [], answers, startedAt: '2026-05-15T00:00:00.000Z' },
    ],
  };
}

function bank(ids, difficulty = 'medium') {
  return ids.map((id) => ({ id, difficulty, chapterId: 'c1' }));
}

// ----- adaptive practice

test('pickAdaptiveSession: prioritizes recently-wrong questions to the top', () => {
  const { pickAdaptiveSession } = loadTs('lib/learning/adaptivePractice.ts');
  const answers = [
    {
      questionId: 'wrong1',
      selectedOptionIds: [],
      isCorrect: false,
      answeredAt: '2026-05-19T10:00:00.000Z',
      timeSpentSeconds: 5,
    },
    {
      questionId: 'correct1',
      selectedOptionIds: [],
      isCorrect: true,
      answeredAt: '2026-05-19T10:01:00.000Z',
      timeSpentSeconds: 5,
    },
  ];
  const picked = pickAdaptiveSession({
    progress: progressFromAnswers(answers),
    bank: bank(['wrong1', 'correct1', 'unseen1', 'unseen2']),
    size: 3,
    now: new Date('2026-05-19T12:00:00.000Z'),
  });
  assert.equal(picked[0], 'wrong1');
});

test('pickAdaptiveSession: empty progress → returns first `size` deterministically', () => {
  const { pickAdaptiveSession } = loadTs('lib/learning/adaptivePractice.ts');
  const picked = pickAdaptiveSession({
    progress: progressFromAnswers([]),
    bank: bank(['q3', 'q1', 'q2']),
    size: 2,
    now: new Date('2026-05-19T12:00:00.000Z'),
  });
  assert.equal(picked.length, 2);
  // Deterministic tiebreak by id.
  assert.deepEqual([...picked].sort(), ['q1', 'q2'].sort());
});

test('pickAdaptiveSession: normalizes malformed adaptive size values including NaN, Infinity, and fraction', () => {
  const { explainAdaptivePick, pickAdaptiveSession } = loadTs('lib/learning/adaptivePractice.ts');
  const items = bank(
    Array.from({ length: 12 }, (_, index) => `q${String(index + 1).padStart(2, '0')}`),
  );
  const baseInput = {
    progress: progressFromAnswers([]),
    bank: items,
    now: new Date('2026-05-19T12:00:00.000Z'),
  };
  const malformedSizes = [Number.NaN, Number.POSITIVE_INFINITY, -1, 2.5, '2'];

  for (const size of malformedSizes) {
    const picked = pickAdaptiveSession({ ...baseInput, size });
    const counts = explainAdaptivePick({ ...baseInput, size });

    assert.equal(picked.length, 10, `malformed size ${String(size)} should use the default cap`);
    assert.equal(
      Object.values(counts).reduce((sum, count) => sum + count, 0),
      picked.length,
      `explanation count should match picker length for size ${String(size)}`,
    );
  }
});

test('pickAdaptiveSession: preserves explicit zero, valid size, oversize cap and chapter filter', () => {
  const { explainAdaptivePick, pickAdaptiveSession } = loadTs('lib/learning/adaptivePractice.ts');
  const items = [
    { id: 'a1', chapterId: 'c1' },
    { id: 'a2', chapterId: 'c1' },
    { id: 'a3', chapterId: 'c1' },
    { id: 'a4', chapterId: 'c1' },
    { id: 'b1', chapterId: 'c2' },
    { id: 'b2', chapterId: 'c2' },
  ];
  const baseInput = {
    progress: progressFromAnswers([]),
    bank: items,
    now: new Date('2026-05-19T12:00:00.000Z'),
  };

  assert.deepEqual(pickAdaptiveSession({ ...baseInput, size: 0 }), []);
  assert.equal(pickAdaptiveSession({ ...baseInput, size: 3 }).length, 3);
  assert.equal(pickAdaptiveSession({ ...baseInput, size: 99 }).length, items.length);
  assert.deepEqual(pickAdaptiveSession({ ...baseInput, size: Number.NaN, chapterId: 'c1' }), [
    'a1',
    'a2',
    'a3',
    'a4',
  ]);
  assert.deepEqual(explainAdaptivePick({ ...baseInput, size: 0 }), {
    'recently-wrong': 0,
    unseen: 0,
    mastered: 0,
    stale: 0,
  });
});

test('pickAdaptiveSession: respects chapter filter', () => {
  const { pickAdaptiveSession } = loadTs('lib/learning/adaptivePractice.ts');
  const items = [
    { id: 'a', chapterId: 'c1' },
    { id: 'b', chapterId: 'c2' },
    { id: 'c', chapterId: 'c1' },
  ];
  const picked = pickAdaptiveSession({
    progress: progressFromAnswers([]),
    bank: items,
    size: 5,
    chapterId: 'c1',
    now: new Date('2026-05-19T12:00:00.000Z'),
  });
  assert.deepEqual(picked.sort(), ['a', 'c']);
});

test('pickAdaptiveSession: high accuracy biases toward hard questions', () => {
  const { pickAdaptiveSession } = loadTs('lib/learning/adaptivePractice.ts');
  const bankMixed = [
    { id: 'easy1', difficulty: 'easy', chapterId: 'c1' },
    { id: 'med1', difficulty: 'medium', chapterId: 'c1' },
    { id: 'hard1', difficulty: 'hard', chapterId: 'c1' },
  ];
  const picked = pickAdaptiveSession({
    progress: progressFromAnswers([]),
    bank: bankMixed,
    size: 1,
    recentAccuracyOverride: 0.95,
    now: new Date('2026-05-19T12:00:00.000Z'),
  });
  assert.equal(picked[0], 'hard1');
});

test('pickAdaptiveSession: low accuracy biases toward easy questions', () => {
  const { pickAdaptiveSession } = loadTs('lib/learning/adaptivePractice.ts');
  const bankMixed = [
    { id: 'easy1', difficulty: 'easy', chapterId: 'c1' },
    { id: 'med1', difficulty: 'medium', chapterId: 'c1' },
    { id: 'hard1', difficulty: 'hard', chapterId: 'c1' },
  ];
  const picked = pickAdaptiveSession({
    progress: progressFromAnswers([]),
    bank: bankMixed,
    size: 1,
    recentAccuracyOverride: 0.2,
    now: new Date('2026-05-19T12:00:00.000Z'),
  });
  assert.equal(picked[0], 'easy1');
});

test('adaptivePractice: picker and explanation share the scoring helper', () => {
  const source = fs.readFileSync(path.join(repoRoot, 'lib/learning/adaptivePractice.ts'), 'utf8');
  const picker = source.match(/export function pickAdaptiveSession[\s\S]*?\n}/)?.[0] ?? '';
  const explanation = source.match(/export function explainAdaptivePick[\s\S]*?\n}/)?.[0] ?? '';

  assert.match(source, /function scoreAdaptiveQuestions\(input: AdaptivePracticeInput\)/);
  assert.match(picker, /scoreAdaptiveQuestions\(input\)/);
  assert.match(explanation, /scoreAdaptiveQuestions\(input\)/);
  assert.equal((source.match(/eligible\.map/g) ?? []).length, 1);
});

test('explainAdaptivePick: reports the same difficulty-adjusted bucket that was picked', () => {
  const { explainAdaptivePick, pickAdaptiveSession } = loadTs('lib/learning/adaptivePractice.ts');
  const answers = [
    {
      questionId: 'a-stale-hard',
      selectedOptionIds: [],
      isCorrect: true,
      answeredAt: '2026-04-14T12:00:00.000Z',
      timeSpentSeconds: 5,
    },
  ];
  const bankMixed = [
    { id: 'a-stale-hard', difficulty: 'hard', chapterId: 'c1' },
    { id: 'z-unseen-easy', difficulty: 'easy', chapterId: 'c1' },
  ];
  const input = {
    progress: progressFromAnswers(answers),
    bank: bankMixed,
    size: 1,
    recentAccuracyOverride: 0.95,
    now: new Date('2026-05-19T12:00:00.000Z'),
  };

  assert.deepEqual(pickAdaptiveSession(input), ['a-stale-hard']);
  assert.deepEqual(explainAdaptivePick(input), {
    'recently-wrong': 0,
    unseen: 0,
    mastered: 0,
    stale: 1,
  });
});

test('pickAdaptiveSession: unsupported adaptive difficulty values are neutral', () => {
  const { explainAdaptivePick, pickAdaptiveSession } = loadTs('lib/learning/adaptivePractice.ts');
  const now = new Date('2026-05-19T12:00:00.000Z');
  const malformedDifficultyCases = createMalformedAdaptiveDifficultyCases();
  const answers = malformedDifficultyCases.map((item, index) => ({
    questionId: `stale-invalid-${index + 1}`,
    selectedOptionIds: [],
    isCorrect: true,
    answeredAt: '2026-04-14T12:00:00.000Z',
    timeSpentSeconds: 5,
  }));
  const input = {
    progress: progressFromAnswers(answers),
    bank: [
      ...malformedDifficultyCases.map((item, index) => ({
        id: `stale-invalid-${index + 1}`,
        difficulty: item.difficulty,
        chapterId: 'c1',
      })),
      { id: 'z-unseen-medium', difficulty: 'medium', chapterId: 'c1' },
    ],
    size: 1,
    recentAccuracyOverride: 0.95,
    now,
  };

  assert.deepEqual(pickAdaptiveSession(input), ['z-unseen-medium']);
  assert.deepEqual(explainAdaptivePick(input), {
    'recently-wrong': 0,
    unseen: 1,
    mastered: 0,
    stale: 0,
  });

  for (const { label, difficulty } of malformedDifficultyCases) {
    const singleInvalidInput = {
      progress: progressFromAnswers([
        {
          questionId: 'a-stale-invalid',
          selectedOptionIds: [],
          isCorrect: true,
          answeredAt: '2026-04-14T12:00:00.000Z',
          timeSpentSeconds: 5,
        },
      ]),
      bank: [
        { id: 'a-stale-invalid', difficulty, chapterId: 'c1' },
        { id: 'z-unseen-medium', difficulty: 'medium', chapterId: 'c1' },
      ],
      size: 1,
      recentAccuracyOverride: 0.95,
      now,
    };

    assert.deepEqual(
      pickAdaptiveSession(singleInvalidInput),
      ['z-unseen-medium'],
      `${label} should be treated as neutral difficulty`,
    );
    assert.deepEqual(
      explainAdaptivePick(singleInvalidInput),
      { 'recently-wrong': 0, unseen: 1, mastered: 0, stale: 0 },
      `${label} should not create a NaN-scored stale pick`,
    );
  }
});

test('pickAdaptiveSession: mixed unsupported runtime difficulty values are neutral', () => {
  const { explainAdaptivePick, pickAdaptiveSession } = loadTs('lib/learning/adaptivePractice.ts');
  const now = new Date('2026-05-19T12:00:00.000Z');
  const answers = [
    {
      questionId: 'a-stale-invalid-string',
      selectedOptionIds: [],
      isCorrect: true,
      answeredAt: '2026-04-14T12:00:00.000Z',
      timeSpentSeconds: 5,
    },
    {
      questionId: 'b-stale-invalid-null',
      selectedOptionIds: [],
      isCorrect: true,
      answeredAt: '2026-04-14T12:00:00.000Z',
      timeSpentSeconds: 5,
    },
    {
      questionId: 'c-stale-invalid-object',
      selectedOptionIds: [],
      isCorrect: true,
      answeredAt: '2026-04-14T12:00:00.000Z',
      timeSpentSeconds: 5,
    },
  ];
  const input = {
    progress: progressFromAnswers(answers),
    bank: [
      { id: 'a-stale-invalid-string', difficulty: 'expert', chapterId: 'c1' },
      { id: 'b-stale-invalid-null', difficulty: null, chapterId: 'c1' },
      { id: 'c-stale-invalid-object', difficulty: { level: 'expert' }, chapterId: 'c1' },
      { id: 'z-unseen-medium', difficulty: 'medium', chapterId: 'c1' },
    ],
    size: 1,
    recentAccuracyOverride: 0.95,
    now,
  };

  assert.deepEqual(pickAdaptiveSession(input), ['z-unseen-medium']);
  assert.deepEqual(explainAdaptivePick(input), {
    'recently-wrong': 0,
    unseen: 1,
    mastered: 0,
    stale: 0,
  });
});

test('explainAdaptivePick: bucket counts roll up correctly', () => {
  const { explainAdaptivePick } = loadTs('lib/learning/adaptivePractice.ts');
  const answers = [
    {
      questionId: 'w1',
      selectedOptionIds: [],
      isCorrect: false,
      answeredAt: '2026-05-19T10:00:00.000Z',
      timeSpentSeconds: 5,
    },
  ];
  const counts = explainAdaptivePick({
    progress: progressFromAnswers(answers),
    bank: bank(['w1', 'unseen1', 'unseen2']),
    size: 3,
    now: new Date('2026-05-19T12:00:00.000Z'),
  });
  assert.equal(counts['recently-wrong'], 1);
  assert.equal(counts['unseen'], 2);
});

test('explainAdaptivePick: invalid and future answer dates do not count as recently wrong', () => {
  const { explainAdaptivePick } = loadTs('lib/learning/adaptivePractice.ts');
  const counts = explainAdaptivePick({
    progress: progressFromAnswers([
      {
        questionId: 'bad-date',
        selectedOptionIds: [],
        isCorrect: false,
        answeredAt: 'not-a-date',
        timeSpentSeconds: 5,
      },
      {
        questionId: 'future-date',
        selectedOptionIds: [],
        isCorrect: false,
        answeredAt: '2099-01-01T00:00:00.000Z',
        timeSpentSeconds: 5,
      },
    ]),
    bank: bank(['bad-date', 'future-date']),
    size: 2,
    now: new Date('2026-05-19T12:00:00.000Z'),
  });

  assert.equal(counts['recently-wrong'], 0);
  assert.equal(counts.unseen, 2);
});

// ----- resume

test('resumeWhereLeftOff: returns null candidate when no answers', () => {
  const { resumeWhereLeftOff } = loadTs('lib/learning/resumeWhereLeftOff.ts');
  const result = resumeWhereLeftOff({
    progress: progressFromAnswers([]),
    questionChapterIndex: {},
    now: new Date('2026-05-19T12:00:00.000Z'),
  });
  assert.equal(result.chapterId, null);
  assert.equal(result.lastAnsweredAt, null);
  assert.equal(result.questionsAnsweredInChapter, 0);
});

test('resumeWhereLeftOff: picks the chapter of the latest answer', () => {
  const { resumeWhereLeftOff } = loadTs('lib/learning/resumeWhereLeftOff.ts');
  const answers = [
    {
      questionId: 'q1',
      selectedOptionIds: [],
      isCorrect: true,
      answeredAt: '2026-05-17T10:00:00.000Z',
      timeSpentSeconds: 5,
    },
    {
      questionId: 'q2',
      selectedOptionIds: [],
      isCorrect: true,
      answeredAt: '2026-05-19T11:00:00.000Z',
      timeSpentSeconds: 5,
    }, // latest
    {
      questionId: 'q3',
      selectedOptionIds: [],
      isCorrect: true,
      answeredAt: '2026-05-18T10:00:00.000Z',
      timeSpentSeconds: 5,
    },
  ];
  const result = resumeWhereLeftOff({
    progress: progressFromAnswers(answers),
    questionChapterIndex: { q1: 'c1', q2: 'c2', q3: 'c2' },
    now: new Date('2026-05-19T12:00:00.000Z'),
  });
  assert.equal(result.chapterId, 'c2');
  assert.equal(result.lastQuestionId, 'q2');
  assert.equal(result.questionsAnsweredInChapter, 2);
});

test('resumeWhereLeftOff: ignores answers older than maxAgeDays', () => {
  const { resumeWhereLeftOff } = loadTs('lib/learning/resumeWhereLeftOff.ts');
  const answers = [
    {
      questionId: 'old',
      selectedOptionIds: [],
      isCorrect: true,
      answeredAt: '2026-01-01T10:00:00.000Z',
      timeSpentSeconds: 5,
    },
  ];
  const result = resumeWhereLeftOff({
    progress: progressFromAnswers(answers),
    questionChapterIndex: { old: 'cOld' },
    now: new Date('2026-05-19T12:00:00.000Z'),
    maxAgeDays: 60,
  });
  assert.equal(result.chapterId, null);
});

test('resumeWhereLeftOff: ignores invalid and future answer dates', () => {
  const { resumeWhereLeftOff } = loadTs('lib/learning/resumeWhereLeftOff.ts');
  const answers = [
    {
      questionId: 'bad-date',
      selectedOptionIds: [],
      isCorrect: false,
      answeredAt: 'not-a-date',
      timeSpentSeconds: 5,
    },
    {
      questionId: 'future-date',
      selectedOptionIds: [],
      isCorrect: true,
      answeredAt: '2099-01-01T00:00:00.000Z',
      timeSpentSeconds: 5,
    },
    {
      questionId: 'valid',
      selectedOptionIds: [],
      isCorrect: true,
      answeredAt: '2026-05-18T10:00:00.000Z',
      timeSpentSeconds: 5,
    },
  ];
  const result = resumeWhereLeftOff({
    progress: progressFromAnswers(answers),
    questionChapterIndex: { 'bad-date': 'c1', 'future-date': 'c1', valid: 'c1' },
    now: new Date('2026-05-19T12:00:00.000Z'),
  });

  assert.equal(result.chapterId, 'c1');
  assert.equal(result.lastQuestionId, 'valid');
  assert.equal(result.questionsAnsweredInChapter, 1);
});

test('resumeBannerCopy: bilingual messages', () => {
  const { resumeBannerCopy } = loadTs('lib/learning/resumeWhereLeftOff.ts');
  const sv = resumeBannerCopy(
    {
      chapterId: 'c1',
      lastQuestionId: 'q1',
      lastAnsweredAt: '2026-05-19',
      questionsAnsweredInChapter: 5,
    },
    'sv',
  );
  const en = resumeBannerCopy(
    {
      chapterId: 'c1',
      lastQuestionId: 'q1',
      lastAnsweredAt: '2026-05-19',
      questionsAnsweredInChapter: 5,
    },
    'en',
  );
  assert.match(sv.title, /Fortsätt/i);
  assert.match(en.title, /Continue/i);
  const empty = resumeBannerCopy(
    { chapterId: null, lastQuestionId: null, lastAnsweredAt: null, questionsAnsweredInChapter: 0 },
    'en',
  );
  assert.match(empty.title, /Pick a chapter/i);
});
