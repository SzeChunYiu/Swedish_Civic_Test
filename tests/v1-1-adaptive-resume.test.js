// Tests for v1.1 adaptive practice + resume selectors (PR8).
// Run with: node --test tests/v1-1-adaptive-resume.test.js

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

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
