const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

const repoRoot = path.resolve(__dirname, '..');
const moduleCache = new Map();

function resolveLocalModule(fromFilePath, request) {
  const base = path.resolve(path.dirname(fromFilePath), request);
  const candidates = [base, `${base}.ts`, `${base}.tsx`, `${base}.js`, path.join(base, 'index.ts')];
  const found = candidates.find(
    (candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile(),
  );
  if (!found) throw new Error(`Cannot resolve ${request} from ${fromFilePath}`);
  return found;
}

function loadTs(relativePath, exportName) {
  const filePath = path.resolve(repoRoot, relativePath);
  if (moduleCache.has(filePath)) {
    const cached = moduleCache.get(filePath);
    return exportName ? cached[exportName] : cached;
  }

  const source = fs.readFileSync(filePath, 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const mod = { exports: {} };
  moduleCache.set(filePath, mod.exports);

  function localRequire(request) {
    if (request.startsWith('.')) {
      return loadTs(path.relative(repoRoot, resolveLocalModule(filePath, request)));
    }
    return require(request);
  }

  new Function('module', 'exports', 'require', output)(mod, mod.exports, localRequire);
  moduleCache.set(filePath, mod.exports);
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

  assert.equal(exam.length, 5);
  assert.deepEqual(
    exam.slice(0, 3).map((question) => question.chapterId),
    ['ch01', 'ch02', 'ch03'],
  );
  assert.equal(new Set(exam.map((question) => question.id)).size, exam.length);
  const chapterCounts = exam.reduce((counts, question) => {
    counts.set(question.chapterId, (counts.get(question.chapterId) || 0) + 1);
    return counts;
  }, new Map());
  const counts = [...chapterCounts.values()];
  assert.ok(Math.max(...counts) - Math.min(...counts) <= 1);
});

test('generateExam rotates question ids by session while preserving deterministic balance', () => {
  const { generateExam } = loadTs('lib/quiz/examGenerator.ts');
  const questions = ['ch01', 'ch02', 'ch03'].flatMap((chapterId) =>
    ['a', 'b', 'c', 'd'].map((slot) => ({
      ...baseQuestion,
      id: `${chapterId}-${slot}`,
      chapterId,
    })),
  );
  const firstSession = generateExam(questions, {
    questionCount: 6,
    sessionId: 'mock-exam-0',
  });
  const firstSessionRepeat = generateExam(questions, {
    questionCount: 6,
    sessionId: 'mock-exam-0',
  });
  const secondSession = generateExam(questions, {
    questionCount: 6,
    sessionId: 'mock-exam-1',
  });
  const thirdSession = generateExam(questions, {
    questionCount: 6,
    sessionId: 'mock-exam-2',
  });
  const idsFor = (exam) => exam.map((question) => question.id);

  assert.deepEqual(idsFor(firstSession), idsFor(firstSessionRepeat));
  assert.notDeepEqual(idsFor(firstSession), idsFor(secondSession));
  assert.notDeepEqual(idsFor(secondSession), idsFor(thirdSession));

  for (const exam of [firstSession, secondSession, thirdSession]) {
    assert.equal(new Set(idsFor(exam)).size, exam.length);
    const chapterCounts = exam.reduce((counts, question) => {
      counts.set(question.chapterId, (counts.get(question.chapterId) || 0) + 1);
      return counts;
    }, new Map());
    assert.deepEqual([...chapterCounts.values()].sort(), [2, 2, 2]);
  }
});

test('generateExam preserves scoring and review after session answer shuffle', () => {
  const { buildExamReviewItems, generateExam, scoreExam } = loadTs('lib/quiz/examGenerator.ts');
  const sourceQuestion = {
    ...baseQuestion,
    id: 'q-shuffle',
    options: [
      { id: 'a', textSv: 'Rätt ursprungssvar', textEn: 'Original correct answer' },
      { id: 'b', textSv: 'Distraktor B', textEn: 'Distractor B' },
      { id: 'c', textSv: 'Distraktor C', textEn: 'Distractor C' },
      { id: 'd', textSv: 'Distraktor D', textEn: 'Distractor D' },
    ],
    correctOptionId: 'a',
  };

  const shuffledExam = Array.from({ length: 12 }, (_unused, index) =>
    generateExam([sourceQuestion], {
      questionCount: 1,
      sessionId: `mock-exam-shuffle-${index}`,
    }),
  ).find(([question]) => question.correctOptionId !== sourceQuestion.correctOptionId);

  assert.ok(shuffledExam, 'at least one deterministic exam session should move the correct answer');
  const [question] = shuffledExam;
  const correctOption = question.options.find((option) => option.id === question.correctOptionId);

  assert.deepEqual(
    question.options.map((option) => option.id),
    ['a', 'b', 'c', 'd'],
  );
  assert.equal(correctOption.textSv, 'Rätt ursprungssvar');
  assert.equal(correctOption.textEn, 'Original correct answer');
  assert.deepEqual(scoreExam([question], { [question.id]: question.correctOptionId }), {
    correctCount: 1,
    totalCount: 1,
    percent: 100,
    chapterBreakdown: [{ chapterId: 'ch01', correctCount: 1, totalCount: 1 }],
  });

  const [review] = buildExamReviewItems([question], { [question.id]: question.correctOptionId });

  assert.equal(review.isCorrect, true);
  assert.equal(review.correctOptionTextSv, 'Rätt ursprungssvar');
  assert.equal(review.correctOptionTextEn, 'Original correct answer');
  assert.equal(review.selectedOptionTextSv, 'Rätt ursprungssvar');
  assert.equal(review.selectedOptionTextEn, 'Original correct answer');
});

test('generateExam review keeps selected wrong answer text after session answer shuffle', () => {
  const { buildExamReviewItems, generateExam, scoreExam } = loadTs('lib/quiz/examGenerator.ts');
  const sourceQuestion = {
    ...baseQuestion,
    id: 'q-shuffle-wrong-review',
    options: [
      { id: 'a', textSv: 'Rätt ursprungssvar', textEn: 'Original correct answer' },
      { id: 'b', textSv: 'Distraktor B', textEn: 'Distractor B' },
      { id: 'c', textSv: 'Distraktor C', textEn: 'Distractor C' },
      { id: 'd', textSv: 'Distraktor D', textEn: 'Distractor D' },
    ],
    correctOptionId: 'a',
  };

  const shuffledExam = Array.from({ length: 12 }, (_unused, index) =>
    generateExam([sourceQuestion], {
      questionCount: 1,
      sessionId: `mock-exam-wrong-review-${index}`,
    }),
  ).find(([question]) => question.correctOptionId !== sourceQuestion.correctOptionId);

  assert.ok(shuffledExam, 'at least one deterministic exam session should move the correct answer');
  const [question] = shuffledExam;
  const selectedWrongOption = question.options.find(
    (option) => option.id !== question.correctOptionId,
  );
  const correctOption = question.options.find((option) => option.id === question.correctOptionId);

  assert.ok(selectedWrongOption, 'shuffled question should expose a selectable wrong answer');
  assert.ok(correctOption, 'shuffled question should expose the remapped correct answer');
  assert.deepEqual(scoreExam([question], { [question.id]: selectedWrongOption.id }), {
    correctCount: 0,
    totalCount: 1,
    percent: 0,
    chapterBreakdown: [{ chapterId: 'ch01', correctCount: 0, totalCount: 1 }],
  });

  const [review] = buildExamReviewItems([question], { [question.id]: selectedWrongOption.id });

  assert.equal(review.isCorrect, false);
  assert.equal(review.selectedOptionTextSv, selectedWrongOption.textSv);
  assert.equal(review.selectedOptionTextEn, selectedWrongOption.textEn);
  assert.equal(review.correctOptionTextSv, correctOption.textSv);
  assert.equal(review.correctOptionTextEn, correctOption.textEn);
  assert.equal(review.correctOptionTextSv, 'Rätt ursprungssvar');
  assert.equal(review.correctOptionTextEn, 'Original correct answer');
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

test('buildExamReviewItems localizes unanswered and missing-correct fallbacks', () => {
  const { buildExamReviewItems } = loadTs('lib/quiz/examGenerator.ts');
  const questions = [
    {
      ...baseQuestion,
      id: 'q-unanswered',
      correctOptionId: 'missing',
      options: [{ id: 'a', textSv: 'Svar', textEn: 'Answer' }],
    },
  ];

  const [review] = buildExamReviewItems(questions, {});

  assert.equal(review.selectedOptionTextSv, 'Inte besvarad');
  assert.equal(review.selectedOptionTextEn, 'Not answered');
  assert.equal(review.correctOptionTextSv, 'Rätt svar saknas');
  assert.equal(review.correctOptionTextEn, 'Correct answer missing');
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
    shouldAutoSubmitExam({
      examActive: true,
      remainingSeconds: 0,
      submitted: false,
      questionCount: 20,
    }),
    true,
  );
  assert.equal(
    shouldAutoSubmitExam({
      examActive: true,
      remainingSeconds: -1,
      submitted: false,
      questionCount: 20,
    }),
    true,
  );
  assert.equal(
    shouldAutoSubmitExam({
      examActive: true,
      remainingSeconds: 1,
      submitted: false,
      questionCount: 20,
    }),
    false,
  );
  assert.equal(
    shouldAutoSubmitExam({
      examActive: true,
      remainingSeconds: 0,
      submitted: true,
      questionCount: 20,
    }),
    false,
  );
  assert.equal(
    shouldAutoSubmitExam({
      examActive: true,
      remainingSeconds: 0,
      submitted: false,
      questionCount: 0,
    }),
    false,
  );
  assert.equal(
    shouldAutoSubmitExam({
      examActive: false,
      remainingSeconds: 0,
      submitted: false,
      questionCount: 20,
    }),
    false,
  );
});
