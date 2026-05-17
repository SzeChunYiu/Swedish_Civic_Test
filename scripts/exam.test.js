const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

const repoRoot = path.resolve(__dirname, '..');

function loadTs(relativePath, exportName) {
  const source = fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const mod = { exports: {} };
  new Function('module', 'exports', 'require', output)(mod, mod.exports, require);
  return exportName ? mod.exports[exportName] : mod.exports;
}

const baseQuestion = {
  id: 'q1',
  chapterId: 'ch01',
  type: 'single_choice',
  questionSv: 'Fråga?',
  questionEn: 'Question?',
  options: [{ id: 'a', textSv: 'A', textEn: 'A' }],
  correctOptionId: 'a',
  explanationSv: 'Förklaring',
  explanationEn: 'Explanation',
  uhrReference: { chapter: 'Landet Sverige', section: 'Geografi', pageApprox: 5 },
  difficulty: 'easy',
  reviewStatus: 'reviewed',
  tags: [],
};

test('generateExam selects reviewed or published UHR-based questions up to requested count', () => {
  const { generateExam } = loadTs('lib/quiz/examGenerator.ts');
  const questions = [
    { ...baseQuestion, id: 'q1' },
    { ...baseQuestion, id: 'q2', chapterId: 'ch02', reviewStatus: 'published' },
    { ...baseQuestion, id: 'draft', reviewStatus: 'draft' },
    { ...baseQuestion, id: 'no-source', uhrReference: undefined },
  ];

  const exam = generateExam(questions, { questionCount: 2 });

  assert.equal(exam.length, 2);
  assert.deepEqual(
    exam.map((question) => question.id),
    ['q1', 'q2'],
  );
});

test('generateExam balances chapter coverage before repeating a chapter', () => {
  const { generateExam } = loadTs('lib/quiz/examGenerator.ts');
  const questions = [
    { ...baseQuestion, id: 'ch01-a', chapterId: 'ch01' },
    { ...baseQuestion, id: 'ch01-b', chapterId: 'ch01' },
    { ...baseQuestion, id: 'ch02-a', chapterId: 'ch02' },
    { ...baseQuestion, id: 'ch02-b', chapterId: 'ch02' },
    { ...baseQuestion, id: 'ch03-a', chapterId: 'ch03' },
    { ...baseQuestion, id: 'ch03-b', chapterId: 'ch03' },
  ];

  const exam = generateExam(questions, { questionCount: 5 });

  assert.deepEqual(
    exam.map((question) => question.id),
    ['ch01-a', 'ch02-a', 'ch03-a', 'ch01-b', 'ch02-b'],
  );
});

test('scoreExam returns score and per-chapter breakdown', () => {
  const { scoreExam } = loadTs('lib/quiz/examGenerator.ts');
  const questions = [
    { ...baseQuestion, id: 'q1', chapterId: 'ch01', correctOptionId: 'a' },
    { ...baseQuestion, id: 'q2', chapterId: 'ch02', correctOptionId: 'b' },
  ];
  const result = scoreExam(questions, { q1: 'a', q2: 'a' });

  assert.equal(result.correctCount, 1);
  assert.equal(result.totalCount, 2);
  assert.equal(result.percent, 50);
  assert.deepEqual(result.chapterBreakdown, [
    { chapterId: 'ch01', correctCount: 1, totalCount: 1 },
    { chapterId: 'ch02', correctCount: 0, totalCount: 1 },
  ]);
});

test('buildExamChapterBreakdownItems adds human-readable chapter names', () => {
  const { buildExamChapterBreakdownItems } = loadTs('lib/quiz/examGenerator.ts');
  const breakdown = [
    { chapterId: 'ch01', correctCount: 1, totalCount: 2 },
    { chapterId: 'unknown', correctCount: 0, totalCount: 1 },
  ];
  const chapters = [
    {
      id: 'ch01',
      nameSv: 'Landet Sverige',
      nameEn: 'The country of Sweden',
      descriptionSv: '',
      descriptionEn: '',
      questionCount: 0,
    },
  ];

  assert.deepEqual(buildExamChapterBreakdownItems(breakdown, chapters), [
    {
      chapterId: 'ch01',
      chapterNameSv: 'Landet Sverige',
      chapterNameEn: 'The country of Sweden',
      correctCount: 1,
      totalCount: 2,
    },
    {
      chapterId: 'unknown',
      chapterNameSv: 'unknown',
      chapterNameEn: 'unknown',
      correctCount: 0,
      totalCount: 1,
    },
  ]);
});

test('buildExamReviewItems returns selected answer, correct answer, source, and explanation', () => {
  const { buildExamReviewItems } = loadTs('lib/quiz/examGenerator.ts');
  const questions = [
    {
      ...baseQuestion,
      id: 'q1',
      correctOptionId: 'b',
      options: [
        { id: 'a', textSv: 'Fel svar', textEn: 'Wrong answer' },
        { id: 'b', textSv: 'Rätt svar', textEn: 'Correct answer' },
      ],
    },
  ];

  const [review] = buildExamReviewItems(questions, { q1: 'a' });

  assert.equal(review.questionId, 'q1');
  assert.equal(review.isCorrect, false);
  assert.equal(review.selectedOptionTextSv, 'Fel svar');
  assert.equal(review.selectedOptionTextEn, 'Wrong answer');
  assert.equal(review.correctOptionTextSv, 'Rätt svar');
  assert.equal(review.correctOptionTextEn, 'Correct answer');
  assert.equal(review.explanationSv, 'Förklaring');
  assert.equal(review.explanationEn, 'Explanation');
  assert.deepEqual(review.uhrReference, baseQuestion.uhrReference);
});

test('formatExamTime renders remaining seconds as mm:ss', () => {
  const { formatExamTime } = loadTs('lib/quiz/examGenerator.ts');

  assert.equal(formatExamTime(1800), '30:00');
  assert.equal(formatExamTime(75), '01:15');
  assert.equal(formatExamTime(-5), '00:00');
});

test('shouldAutoSubmitExam submits only when a live exam reaches zero', () => {
  const { shouldAutoSubmitExam } = loadTs('lib/quiz/examGenerator.ts');

  assert.equal(
    shouldAutoSubmitExam({ remainingSeconds: 0, submitted: false, questionCount: 20 }),
    true,
  );
  assert.equal(
    shouldAutoSubmitExam({ remainingSeconds: -1, submitted: false, questionCount: 20 }),
    true,
  );
  assert.equal(
    shouldAutoSubmitExam({ remainingSeconds: 1, submitted: false, questionCount: 20 }),
    false,
  );
  assert.equal(
    shouldAutoSubmitExam({ remainingSeconds: 0, submitted: true, questionCount: 20 }),
    false,
  );
  assert.equal(
    shouldAutoSubmitExam({ remainingSeconds: 0, submitted: false, questionCount: 0 }),
    false,
  );
});
